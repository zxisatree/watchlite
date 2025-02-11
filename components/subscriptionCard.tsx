import { chooseThumbnail } from '@/utils/utils'
import CircularImage from './circularImage'

export default function SubscriptionCard({
  channel,
  channelThumbnails,
}: Readonly<{
  channel: gapi.client.youtube.Channel
  channelThumbnails?: gapi.client.youtube.ThumbnailDetails
}>) {
  return (
    <div className='max-w-15 space-y-2 flex flex-col items-center bg-gray-300 bg-opacity-50 p-2 rounded-lg'>
      {channelThumbnails && (
        <CircularImage
          thumbnailUrl={chooseThumbnail(channelThumbnails, 'high').url}
          diameter={24}
        />
      )}
      <div className='overflow-hidden whitespace-nowrap overflow-ellipsis max-w-full'>
        {channel.snippet?.title}
      </div>
    </div>
  )
}
