'use client'

import { useContext, useEffect, useState } from 'react'
import { GapiContext } from './gapiCtxt'
import {
  fetchPlaylistItems,
  mod,
  murmurHash,
  fetchSubscriptionUploadsRequestPipeline,
} from './utils'
import { VideoListInfo } from './types'
import SubscriptionSummaryList from '@/components/subscriptionSummaryList'
import { colouredActiveTiles, colouredTiles } from './tailwindStyles'
import VideoCard from '@/components/videoCard'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/loadingSpinner'
import { maxVideosDisplayed, gapiRequestLimit } from './constants'
import { UserContext } from './userCtxt'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chosenPlaylistId = searchParams.get('playlistId')
  const { gapiIsInitialised, gapiRequestCount, setGapiRequestCount } =
    useContext(GapiContext)
  const { subscriptions, playlists } = useContext(UserContext)
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false)
  const [playlistVideoListInfo, setPlaylistVideoListInfo] =
    useState<VideoListInfo>({ videos: [], channels: {} })
  console.log('playlistVideoListInfo:')
  console.log(playlistVideoListInfo)

  const channelMap = subscriptions.reduce(
    (acc: Record<string, gapi.client.youtube.Channel>, subscription) => {
      const channel = subscription.channel
      // if (channel.id && channel.id in acc) {
      //   console.log(
      //     `subscriptions duplicate key channel: ${channel.snippet?.title}`,
      //   )
      // }

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

  // generate video count summary string
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

  // fetch playlist videos
  useEffect(() => {
    if (!gapiIsInitialised) {
      return
    }

    if (gapiRequestCount > gapiRequestLimit) {
      console.log(
        `gapiRequestCount exceeded ${gapiRequestLimit}, not sending request`,
      )
      return
    }
    setGapiRequestCount(gapiRequestCount + 1)

    if (!chosenPlaylistId && subscriptions) {
      // get subscription videos
      setIsPlaylistLoading(true)
      fetchSubscriptionUploadsRequestPipeline(
        subscriptions.map(subscription => subscription.channel.id || ''),
        setPlaylistVideoListInfo,
        setIsPlaylistLoading,
      )
    }
    if (chosenPlaylistId && playlistMap[chosenPlaylistId]) {
      setIsPlaylistLoading(true)
      fetchPlaylistItems(
        playlistMap[chosenPlaylistId],
        setPlaylistVideoListInfo,
        setIsPlaylistLoading,
      )
    }
  }, [
    gapiIsInitialised,
    chosenPlaylistId,
    chosenPlaylistId && playlistMap[chosenPlaylistId],
    subscriptions,
  ])

  return (
    <div className='flex flex-col justify-center items-center'>
      <SubscriptionSummaryList
        channels={subscriptions.map(subscription => subscription.channel)}
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
      {isPlaylistLoading ? (
        <LoadingSpinner />
      ) : chosenPlaylistId ? (
        // playlistVideoListInfo is not modified until query completes
        playlistVideoListInfo.videos.slice(0, maxVideosDisplayed).map(video => (
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
      ) : (
        playlistVideoListInfo.videos.slice(0, maxVideosDisplayed).map(video => {
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
        })
      )}
    </div>
  )
}
