'use client'

import { useContext, useEffect, useState } from 'react'
import { GapiContext } from '../gapiCtxt'
import LoadingSpinner from '@/components/loadingSpinner'
import ChannelHead from '@/components/channelHead'
import { greenButton } from '../tailwindStyles'
import { handleNextPageResponses, isNotUndefined } from '../utils'
import VideoCard from '@/components/videoCard'

export default function ChannelPage({
  channelHandle,
}: {
  channelHandle: string
}) {
  const { gapiIsInitialised, incGapiRequestCount } = useContext(GapiContext)
  const [channel, setChannel] = useState<gapi.client.youtube.Channel | null>(
    null,
  )
  const [videos, setVideos] = useState<gapi.client.youtube.Video[]>([])

  function stripLeadingAt(handle: string) {
    return handle.replace(/^@/, '')
  }
  const parsedChannelHandle = stripLeadingAt(decodeURIComponent(channelHandle))

  function sendRequest(handle?: string) {
    if (!incGapiRequestCount()) {
      console.log('max requests reached')
      return
    }

    console.log(`requesting for channel: ${handle || parsedChannelHandle}`)
    gapi.client.youtube.channels
      .list({
        part: 'snippet,contentDetails,statistics',
        forHandle: handle || parsedChannelHandle,
      })
      .then(response => {
        console.log('channel list response:')
        console.log(response)
        const items = response?.result?.items
        if (!items || items.length > 1) {
          console.error(`unexpected number of items (not 1): ${items?.length}`)
          return
        }
        setChannel(items[0])
        return items[0]
      })
      .then(channel => {
        if (!channel) {
          console.error('no channel found')
          return
        }
        const baseParams = {
          part: 'snippet',
          playlistId: channel.contentDetails?.relatedPlaylists?.uploads,
        }
        // TODO: takes really long
        return gapi.client.youtube.playlistItems
          .list(baseParams)
          .then(response =>
            handleNextPageResponses(
              response,
              gapi.client.youtube.playlistItems.list,
              baseParams,
            ),
          )
      })
      .then(playlistItems => {
        if (!playlistItems) {
          console.error('no playlist items found')
          return
        }
        console.log('playlist items:')
        console.log(playlistItems)
        const videoIds = playlistItems
          .map(item => item.snippet?.resourceId?.videoId)
          .filter(isNotUndefined)
        const result = []
        // TODO: move to constants
        const maxResultsRetrieved = Math.max(videoIds.length, 100)
        for (let i = 0; i < maxResultsRetrieved; i += 50) {
          result.push(
            gapi.client.youtube.videos.list({
              part: 'snippet,contentDetails,statistics',
              id: videoIds.slice(i, i + 50).join(','),
            }),
          )
        }
        return Promise.all(result)
      })
      .then(videoResponses => {
        if (!videoResponses) {
          console.error('no video responses found')
          return
        }
        const videos = videoResponses
          .map(response => response.result?.items)
          .filter(isNotUndefined)
          .flat()
        setVideos(videos)
      })
  }

  useEffect(() => {
    if (gapiIsInitialised) {
      sendRequest()
    }
  }, [gapiIsInitialised])

  return (
    <div className='m-4 space-y-4'>
      <button
        className={greenButton}
        onClick={() =>
          sendRequest(
            (document.querySelector('#channelHandleInput') as HTMLInputElement)
              ?.value,
          )
        }
      >
        Send request
      </button>
      <input
        id='channelHandleInput'
        className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 focus:placeholder-transparent'
        type='text'
      />
      {channel ? (
        <div className='flex flex-col justify-center items-center space'>
          <ChannelHead channel={channel} />
          {videos.length > 0 ? (
            videos.map(video => (
              <VideoCard
                key={video.id}
                thumbnailDetails={video.snippet?.thumbnails}
                video={video}
                channel={channel}
              />
            ))
          ) : (
            <LoadingSpinner />
          )}
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  )
}
