'use client'

import { useContext, useEffect, useState } from 'react'
import { EnvContext } from './ctxt'
import {
  fetchPlaylistItems,
  mod,
  murmurHash,
  sendChannelListRequestConcat,
  sendPlaylistListRequest,
  sendSubscriptionsListRequest,
  fetchSubscriptionUploadsRequestPipeline,
} from './utils'
import { VideoListInfo } from './types'
import SubscriptionSummaryList from '@/components/subscriptionSummaryList'
import { colouredActiveTiles, colouredTiles } from './tailwindStyles'
import VideoCard from '@/components/videoCard'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chosenPlaylistId = searchParams.get('playlistId')
  const {
    gapiIsInitialised,
    subscriptions,
    setSubscriptions,
    oauthToken,
    gapiRequestCount,
    setGapiRequestCount,
  } = useContext(EnvContext)
  const [subscribedChannels, setSubscribedChannels] = useState<
    gapi.client.youtube.Channel[]
  >([])
  const [playlists, setPlaylists] = useState<gapi.client.youtube.Playlist[]>([])
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false)
  const [playlistVideoListInfo, setPlaylistVideoListInfo] =
    useState<VideoListInfo>({ videos: [], channels: {} })
  console.log('playlistVideoListInfo:')
  console.log(playlistVideoListInfo)

  const gapiRequestLimit = 5
  const maxVideosDisplayed = 50
  const isOauthTokenValid = !(
    !oauthToken ||
    !oauthToken.expiry_date ||
    new Date() >= oauthToken.expiry_date
  )

  const channelMap = subscribedChannels.reduce(
    (acc: Record<string, gapi.client.youtube.Channel>, channel) => {
      if (channel.id && channel.id in acc) {
        console.error('subscriptions duplicate key channel:')
        console.log(channel)
      }

      if (channel.id) {
        acc[channel.id] = channel
      }
      return acc
    },
    {},
  )

  const playlistMap = playlists.reduce(
    (acc: Record<string, gapi.client.youtube.Playlist>, playlist) => {
      if (playlist.id) {
        acc[playlist.id] = playlist
      }
      return acc
    },
    {},
  )

  const chosenPlaylist = playlistMap[chosenPlaylistId || '']
  const playlistItemCount = chosenPlaylistId
    ? chosenPlaylist?.contentDetails?.itemCount
    : playlistVideoListInfo.videos.length
  const videoCount = playlistItemCount
    ? Math.min(maxVideosDisplayed, playlistItemCount)
    : maxVideosDisplayed
  const videoCountString = `${
    videoCount < maxVideosDisplayed ? 'all ' : 'first '
  }${videoCount}${
    chosenPlaylistId && videoCount >= maxVideosDisplayed
      ? ` out of ${playlistItemCount}`
      : ''
  }`

  // fetch subscriptions and playlists
  useEffect(() => {
    if (
      gapiIsInitialised &&
      oauthToken &&
      new Date() < oauthToken.expiry_date
    ) {
      if (gapiRequestCount > gapiRequestLimit) {
        console.log(
          `gapiRequestCount exceeded ${gapiRequestLimit}, not sending request`,
        )
        return
      }
      setGapiRequestCount(gapiRequestCount + 1)
      sendSubscriptionsListRequest(setSubscriptions)
      sendPlaylistListRequest(setPlaylists)
    }
  }, [gapiIsInitialised, oauthToken])

  // fetch playlist videos
  useEffect(() => {
    if (
      !chosenPlaylistId ||
      !gapiIsInitialised ||
      !playlistMap[chosenPlaylistId]
    ) {
      return
    }
    // console.log("playlistMap:")
    // console.log(playlistMap)

    if (gapiRequestCount > gapiRequestLimit) {
      console.log(
        `gapiRequestCount exceeded ${gapiRequestLimit}, not sending request`,
      )
      return
    }
    setGapiRequestCount(gapiRequestCount + 1)

    fetchPlaylistItems(
      playlistMap[chosenPlaylistId],
      setPlaylistVideoListInfo,
      setIsPlaylistLoading,
    )
  }, [
    gapiIsInitialised,
    chosenPlaylistId,
    chosenPlaylistId && playlistMap[chosenPlaylistId],
  ])

  // fetch subscription videos
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
        sendChannelListRequestConcat(
          channelIds.slice(i, i + 50),
          setSubscribedChannels,
        )
      }

      // get subscription videos
      fetchSubscriptionUploadsRequestPipeline(
        subscriptions.map(
          subscription => subscription.snippet?.resourceId?.channelId || '',
        ),
        setPlaylistVideoListInfo,
        // setSubscriptionVideos,
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
        channels={subscribedChannels}
        channelMap={channelMap}
      />
      <div className='grid grid-cols-5 gap-2'>
        {playlists.map(playlist => {
          const tileIdx = mod(
            murmurHash(playlist.id || ''),
            colouredTiles.length,
          )
          const isActivePlaylist = chosenPlaylistId === playlist.id
          return (
            <button
              className={
                isActivePlaylist
                  ? colouredActiveTiles[tileIdx]
                  : colouredTiles[tileIdx]
              }
              key={playlist.id}
              onClick={() => {
                if (chosenPlaylistId === playlist.id) {
                  // Deselect playlist
                  router.push('/')
                  return
                }

                setIsPlaylistLoading(true)
                router.push(`/?playlistId=${playlist.id}`)
              }}
            >
              {playlist.snippet?.title}
            </button>
          )
        })}
      </div>
      <div className='text-4xl my-4 pt-2 border-t-2 border-gray-500 w-full text-center'>
        {chosenPlaylistId
          ? `${playlistMap[chosenPlaylistId]?.snippet?.title} videos`
          : `Subscription videos`}{' '}
        ({videoCountString})
      </div>
      {chosenPlaylistId
        ? // playlistVideoListInfo is not modified until query completes
          !isPlaylistLoading &&
          playlistVideoListInfo.videos
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
        : playlistVideoListInfo.videos
            .slice(0, maxVideosDisplayed)
            .map(video => {
              const channelId = video.snippet?.channelId
              const channel = channelMap[channelId || '']
              return (
                <VideoCard
                  key={video.id}
                  thumbnailDetails={video.snippet?.thumbnails}
                  video={video}
                  channel={channel}
                />
              )
            })}
    </div>
  )
}
