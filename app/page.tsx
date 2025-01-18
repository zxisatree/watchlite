'use client'

import { useContext, useEffect, useState } from 'react'
import { EnvContext } from './ctxt'
import {
  isNotUndefined,
  mod,
  murmurHash,
  sendChannelListRequestConcat,
  sendPlaylistListRequest,
  sendSubscriptionsListRequest,
  sendSubscriptionUploadsRequestPipeline,
} from './utils'
import SearchResult from '@/components/searchResult'
import { FullSearchResult, OauthTokenState, VideoListInfo } from './types'
import SubscriptionSummaryList from '@/components/subscriptionSummaryList'
import { colouredActiveTiles, colouredTiles } from './tailwindStyles'
import VideoCard from '@/components/videoCard'

type BaseParams = {
  part: string
  playlistId: string | undefined
  access_token: string | undefined
}

function handlePlaylistItemsResponse(
  response: gapi.client.Response<gapi.client.youtube.PlaylistItemListResponse>,
  baseParams: BaseParams,
  acc: gapi.client.youtube.PlaylistItem[],
):
  | Promise<gapi.client.youtube.PlaylistItem[]>
  | gapi.client.youtube.PlaylistItem[] {
  const responseResult = response.result
  const responseItems = responseResult.items
  if (!responseItems) {
    return acc
  }

  // send requests for all playlist items
  const nextPageToken = responseResult.nextPageToken
  if (nextPageToken) {
    const nextPageParams = {
      ...baseParams,
      pageToken: nextPageToken,
    }
    return gapi.client.youtube.playlistItems
      .list(nextPageParams)
      .then(response =>
        handlePlaylistItemsResponse(
          response,
          baseParams,
          acc.concat(responseItems),
        ),
      )
  } else {
    return acc.concat(responseItems)
  }
}

function handleSelectPlaylist(
  oauthToken: OauthTokenState | null,
  playlist: gapi.client.youtube.Playlist,
  chosenPlaylist: gapi.client.youtube.Playlist | null,
  setChosenPlaylist: React.Dispatch<
    React.SetStateAction<gapi.client.youtube.Playlist | null>
  >,
  setPlaylistVideoListInfo: React.Dispatch<React.SetStateAction<VideoListInfo>>,
) {
  setChosenPlaylist((prevPlaylist: gapi.client.youtube.Playlist | null) =>
    prevPlaylist?.id === playlist.id ? null : playlist,
  )
  if (chosenPlaylist?.id === playlist.id) {
    // Deselect playlist
    return
  }

  const baseParams = {
    part: 'snippet',
    playlistId: playlist.id,
    access_token: oauthToken?.access_token,
  }
  gapi.client.youtube.playlistItems
    .list(baseParams)
    .then(response => handlePlaylistItemsResponse(response, baseParams, []))
    .then(playlistItems => {
      // Collect all videos and channels
      const videos = playlistItems
        .map(playlistItem => playlistItem.snippet?.resourceId?.videoId)
        .filter(isNotUndefined)
      const channels = Array.from(
        new Set(
          playlistItems
            .map(playlistItem => playlistItem.snippet?.videoOwnerChannelId)
            .filter(isNotUndefined),
        ),
      )

      console.log('playlistItems:')
      console.log(playlistItems)

      // TODO: batch by 50
      const videoPromise = gapi.client.youtube.videos.list({
        part: 'snippet',
        id: videos.slice(0, 50).join(','),
      })
      const channelPromise = gapi.client.youtube.channels.list({
        part: 'snippet',
        id: channels.slice(0, 50).join(','),
      })

      return Promise.all([videoPromise, channelPromise])
    })
    .then(([videoResponse, channelResponse]) => {
      const videoItems = videoResponse.result?.items
      const channelItems = channelResponse.result?.items
      if (!videoItems || !channelItems) {
        return
      }

      console.log('videoItems:')
      console.log(videoItems)
      console.log('channelItems:')
      console.log(channelItems)

      setPlaylistVideoListInfo({
        videos: videoItems,
        channels: channelItems.reduce(
          (acc: Record<string, gapi.client.youtube.Channel>, channel) => {
            if (channel.id) {
              acc[channel.id] = channel
            }
            return acc
          },
          {},
        ),
      })
    })
}

export default function Page() {
  const {
    gapiIsInitialised,
    subscriptions,
    setSubscriptions,
    oauthToken,
    gapiRequestCount,
    setGapiRequestCount,
  } = useContext(EnvContext)
  const [channels, setChannels] = useState<gapi.client.youtube.Channel[]>([])
  const [subscriptionVideos, setSubscriptionVideos] = useState<
    gapi.client.youtube.Video[]
  >([])
  const [playlists, setPlaylists] = useState<gapi.client.youtube.Playlist[]>([])
  // null represents no playlist chosen, and subscriptions will be displayed instead
  const [chosenPlaylist, setChosenPlaylist] =
    useState<gapi.client.youtube.Playlist | null>(null)
  const [playlistVideoListInfo, setPlaylistVideoListInfo] =
    useState<VideoListInfo>({ videos: [], channels: {} })

  const gapiRequestLimit = 5
  const maxVideosDisplayed = 15
  const isOauthTokenValid = !(
    !oauthToken ||
    !oauthToken.expiry_date ||
    new Date() >= oauthToken.expiry_date
  )
  const channelMap: Record<string, gapi.client.youtube.Channel> = {}
  channels.forEach(channel => {
    if (channel.id) {
      channelMap[channel.id] = channel
    }

    // check for duplicate key error
    if (channel.id === 'ZdDlXPWHLwI') {
      console.log('channel:')
      console.log(channel)
    }
  })

  useEffect(() => {
    if (gapiIsInitialised && oauthToken) {
      if (new Date() < oauthToken.expiry_date) {
        if (gapiRequestCount > gapiRequestLimit) {
          console.log(
            `gapiRequestCount exceeded ${gapiRequestLimit}, not sending request`,
          )
          return
        }
        setGapiRequestCount(gapiRequestCount + 1)
        sendSubscriptionsListRequest(oauthToken.access_token, setSubscriptions)
        sendPlaylistListRequest(oauthToken.access_token, setPlaylists)
      }
    }
  }, [gapiIsInitialised, oauthToken])

  useEffect(() => {
    const channelIds = subscriptions.map(
      subscription => subscription.snippet?.resourceId?.channelId || '',
    )
    if (channelIds.length > 0) {
      if (gapiRequestCount > gapiRequestLimit) {
        console.log(
          `gapiRequestCount exceeded ${gapiRequestLimit}, not sending request`,
        )
        return
      }
      setGapiRequestCount(gapiRequestCount + 1)

      // batch in 50s (max filter size)
      for (let i = 0; i < channelIds.length; i += 50) {
        sendChannelListRequestConcat(channelIds.slice(i, i + 50), setChannels)
      }

      // get subscription videos
      sendSubscriptionUploadsRequestPipeline(
        subscriptions.map(
          subscription => subscription.snippet?.resourceId?.channelId || '',
        ),
        setSubscriptionVideos,
      )
    }
  }, [subscriptions])

  return (
    <div className='flex flex-col justify-center items-center'>
      {isOauthTokenValid ? (
        <div className='bg-green-200 p-2 rounded-lg mt-2'>
          OAuth token is valid!
        </div>
      ) : (
        <div className='bg-red-200 p-2 rounded-lg mt-2'>
          Invalid OAuth token.
        </div>
      )}
      <SubscriptionSummaryList
        subscriptions={subscriptions}
        channels={channels}
        channelMap={channelMap}
      />
      <div className='grid grid-cols-5 gap-2'>
        {playlists.map(playlist => {
          const tileIdx = mod(
            murmurHash(playlist.id || ''),
            colouredTiles.length,
          )
          const isActivePlaylist = chosenPlaylist?.id === playlist.id
          return (
            <button
              className={
                isActivePlaylist
                  ? colouredActiveTiles[tileIdx]
                  : colouredTiles[tileIdx]
              }
              key={playlist.id}
              onClick={() =>
                handleSelectPlaylist(
                  oauthToken,
                  playlist,
                  chosenPlaylist,
                  setChosenPlaylist,
                  setPlaylistVideoListInfo,
                )
              }
            >
              {playlist.snippet?.title}
            </button>
          )
        })}
      </div>
      <div className='text-4xl my-4 pt-2 border-t-2 border-gray-500 w-full text-center'>
        {chosenPlaylist
          ? `${chosenPlaylist?.snippet?.title} videos`
          : `Subscription videos`}{' '}
        (first {maxVideosDisplayed})
      </div>
      {chosenPlaylist !== null
        ? playlistVideoListInfo.videos
            .slice(0, maxVideosDisplayed)
            .map(video => (
              <VideoCard
                key={video.id}
                thumbnailDetails={video.snippet?.thumbnails}
                video={video}
                channel={
                  // channel has to exist in map
                  playlistVideoListInfo.channels[video.snippet!.channelId!]
                }
              />
            ))
        : subscriptionVideos.slice(0, maxVideosDisplayed).map(video => {
            const channelId = video.snippet?.channelId
            const result: FullSearchResult = { video }
            if (channelId && channelId in channelMap) {
              result.channel = channelMap[channelId]
            }
            return <SearchResult key={video.id} fullResult={result} />
          })}
    </div>
  )
}
