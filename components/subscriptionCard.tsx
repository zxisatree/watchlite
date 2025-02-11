import { chooseThumbnail } from '@/utils/utils'
import CircularImage from './circularImage'

export default function SubscriptionCard({
  channel,
  channelMap,
}: Readonly<{
  channel: gapi.client.youtube.Channel
  channelMap: Record<string, gapi.client.youtube.Channel>
}>) {
  // should always be defined if channels have all been fetched
  // const linkUrl = channelDetails.snippet?.customUrl
  const channelId = channel.id || ''
  const channelDetails = channelMap[channelId]
  const channelThumbnails = channelDetails.snippet?.thumbnails
  return (
    <div className='max-w-15 space-y-2 flex flex-col items-center bg-gray-300 bg-opacity-50 p-2 rounded-lg'>
      {channelThumbnails && (
        <CircularImage
          thumbnailUrl={chooseThumbnail(channelThumbnails).url}
          diameter={24}
        />
      )}
      <div className='overflow-hidden whitespace-nowrap overflow-ellipsis max-w-full'>
        {channel.snippet?.title}
      </div>
    </div>
  )
}
