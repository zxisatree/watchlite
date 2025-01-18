import { chooseThumbnail } from '@/app/utils'
import CircularImage from './circularImage'

export default function SubscriptionCard({
  subscription,
  channelMap,
}: Readonly<{
  subscription: gapi.client.youtube.Subscription
  channelMap: Record<string, gapi.client.youtube.Channel>
}>) {
  // should always be defined if channels have all been fetched
  // const linkUrl = channelDetails.snippet?.customUrl
  const channelId = subscription.snippet?.resourceId?.channelId || ''
  const channelDetails = channelMap[channelId]
  const channelThumbnails = channelDetails.snippet?.thumbnails
  return (
    <div className='max-w-15 space-y-2 flex flex-col items-center bg-gray-300 bg-opacity-50 p-2 rounded-lg'>
      {channelThumbnails && (
        <CircularImage
          thumbnail={chooseThumbnail(channelThumbnails)}
          diameter={24}
        />
      )}
      <div className='overflow-hidden whitespace-nowrap overflow-ellipsis max-w-full'>
        {subscription.snippet?.title}
      </div>
    </div>
  )
}
