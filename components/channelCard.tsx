import { chooseThumbnail, stringifyCount } from '@/utils/utils'
import Link from 'next/link'
import CircularImage from './circularImage'
import ResultCard from './resultCard'

export default function ChannelCard({
  channel,
}: {
  channel: gapi.client.youtube.Channel
}) {
  const snippet = channel.snippet
  const statistics = channel.statistics
  const subscriberCount = statistics?.subscriberCount
  if (!snippet) {
    return <ResultCard>Snippet not found</ResultCard>
  }

  return (
    <ResultCard>
      <Link href={`/watch?${snippet.customUrl}`} className='flex'>
        <div className='w-[420px] h-[300px] flex-shrink-0 flex-grow-0 flex flex-col items-center justify-center'>
          <CircularImage
            thumbnailUrl={
              snippet.thumbnails
                ? chooseThumbnail(snippet.thumbnails, 'high').url
                : '/default_thumbnail.png'
            }
            diameter={180}
          />
        </div>
        {/* Unflex */}
        <div className='py-2 space-y-2'>
          <div className='mb-2 text-xl font-bold text-wrap'>
            {snippet.title || 'Title not found'}
          </div>
          <div className='text-gray-700'>{snippet.customUrl}</div>
          {subscriberCount && (
            <>
              <div className='text-gray-400'>&bull;</div>
              <div className='text-gray-700'>
                {stringifyCount(subscriberCount, 0)} subscribers
              </div>
            </>
          )}
          <div className='text-gray-700 text-sm'>{snippet.description}</div>
        </div>
      </Link>
    </ResultCard>
  )
}
