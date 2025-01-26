'use client'

import { stringifyCount } from '@/app/utils'
import CircularImage from './circularImage'

export default function ChannelHead({
  channel,
}: {
  channel: gapi.client.youtube.Channel
}) {
  // TODO: statistics might not exist
  const subscriberCount = channel.statistics!.subscriberCount!
  return (
    <div className='flex space-x-4 my-4'>
      <CircularImage
        thumbnailUrl={channel.snippet?.thumbnails?.high?.url}
        diameter={160}
      />
      <div className='space-y-2'>
        <div className='text-4xl font-bold'>{channel.snippet?.title}</div>
        <div className='flex flex-row space-x-1 text-sm'>
          <div className='font-semibold'>{channel.snippet?.customUrl}</div>
          <div className='text-gray-400'>&bull;</div>
          <div className='text-gray-600'>
            {stringifyCount(subscriberCount, 1)} subscribers
          </div>
          <div className='text-gray-400'>&bull;</div>
          <div className='text-gray-600'>
            {channel.statistics?.videoCount} videos
          </div>
        </div>
        <div className='text-sm text-gray-600 whitespace-pre'>
          {channel.snippet?.description}
        </div>
      </div>
    </div>
  )
}
