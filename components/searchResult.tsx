import Image from 'next/image'
import Link from 'next/link'
import { MdOutlineVisibility, MdCalendarToday, MdThumbUp } from 'react-icons/md'
import { FullSearchResult } from '../app/types'
import {
  chooseThumbnail,
  stringifyCount,
  stringifyDateRelatively,
} from '../app/utils'
import VideoCard from './videoCard'
import ResultCard from './resultCard'
import CircularImage from './circularImage'

type SearchResultProps = {
  fullResult: FullSearchResult
}

export default function SearchResult({ fullResult }: SearchResultProps) {
  const defaultVideoThumbnail = fullResult.video?.snippet?.thumbnails?.high
  const defaultChannelThumbnail =
    fullResult.channel?.snippet?.thumbnails?.default
  const defaultUrl = defaultVideoThumbnail?.url

  const video = fullResult.video
  const channel = fullResult.channel
  if (video) {
    return (
      <VideoCard
        video={video}
        thumbnailDetails={fullResult.video?.snippet?.thumbnails}
      />
    )
  } else if (channel) {
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
  } else {
    return (
      <ResultCard>
        <Link
          href={`/watch?v=${fullResult.video?.id}`}
          className='w-[70%] p-2 border-black border flex flex-row'
        >
          <div className='w-[30%] flex-shrink-0 flex-grow-0'>
            <div className='w-[95%]'>
              <Image
                src={defaultUrl || '/default_thumbnail.png'}
                alt={`${fullResult.video?.snippet?.title} thumbnail`}
                width={
                  defaultVideoThumbnail ? defaultVideoThumbnail.width : 480
                }
                height={
                  defaultVideoThumbnail ? defaultVideoThumbnail.height : 360
                }
              />
            </div>
          </div>
          <div className='w-[70%]'>
            <h5 className='flex-shrink-0 flex-grow-0 mb-2 text-xl font-bold'>
              {fullResult.video?.snippet?.title || 'Title not found'}
            </h5>
            <div
              // href={fullResult.channel?.snippet?.customUrl || ''}
              className='flex space-x-2'
            >
              <Image
                className='rounded-full aspect-square object-cover'
                src={defaultChannelThumbnail?.url || '/default_thumbnail.png'}
                alt={`${fullResult.channel?.snippet?.title} thumbnail`}
                width={24}
                height={24}
              />
              <div className='text-center'>
                {fullResult.channel?.snippet?.title}
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='flex space-x-1'>
                <MdOutlineVisibility size={20} className='self-end' />
                <div className='text-center'>
                  {stringifyCount(
                    fullResult.video?.statistics?.viewCount || '0',
                    2,
                  )}
                </div>
              </div>
              <div className='text-gray-400'>&bull;</div>
              <div className='flex space-x-1'>
                <MdCalendarToday size={20} className='self-end' />
                <div className='text-center'>
                  {fullResult.video?.snippet?.publishedAt
                    ? stringifyDateRelatively(
                        fullResult.video?.snippet?.publishedAt,
                      )
                    : 'No publish information found'}
                </div>
              </div>
              <div className='text-gray-400'>&bull;</div>
              <div className='flex space-x-1'>
                <MdThumbUp size={20} className='self-end' />
                <div className='text-center'>
                  {stringifyCount(
                    fullResult.video?.statistics?.likeCount || '0',
                    0,
                  )}
                </div>
              </div>
            </div>
            <div className='pr-8 text-gray-700 text-sm'>
              {fullResult.video?.snippet?.description}
            </div>
          </div>
        </Link>
      </ResultCard>
    )
  }
}
