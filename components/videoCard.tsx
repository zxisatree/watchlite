import Image from 'next/image'
import Link from 'next/link'
import { MdOutlineVisibility, MdCalendarToday, MdThumbUp } from 'react-icons/md'
import {
  chooseThumbnail,
  stringifyCount,
  stringifyDateRelatively,
} from '../utils/utils'
import ResultCard from './resultCard'

type VideoCardProps = {
  video: gapi.client.youtube.Video
  thumbnailDetails?: gapi.client.youtube.ThumbnailDetails
  channel?: gapi.client.youtube.Channel
  playlistId?: string
}

export default function VideoCard({
  thumbnailDetails,
  video,
  channel,
  playlistId,
}: VideoCardProps) {
  const thumbnailUrl = thumbnailDetails
    ? chooseThumbnail(thumbnailDetails, 'high').url || 'default_thumbnail.png'
    : 'default_thumbnail.png'
  const url = `/watch?v=${video.id}${playlistId ? `&list=${playlistId}` : ''}`

  // height is usually 360, width is usually 480
  return (
    <ResultCard>
      <Link
        href={url}
        className='w-[420px] h-[300px] flex-shrink-0 flex-grow-0 relative'
      >
        <Image
          className='p-2 rounded-2xl'
          src={thumbnailUrl}
          alt={`${video.snippet?.title} thumbnail`}
          fill
          style={{ objectFit: 'cover' }}
        />
      </Link>
      {/* Unflex */}
      <div className='py-2 space-y-2'>
        <Link href={url} className='mb-2 text-xl font-bold text-wrap'>
          {video.snippet?.title || 'Title not found'}
        </Link>
        {channel && (
          <Link
            href={channel?.snippet?.customUrl || ''}
            className='flex space-x-2'
          >
            <Image
              className='rounded-full aspect-square object-cover'
              src={
                channel?.snippet?.thumbnails?.default?.url ||
                '/default_thumbnail.png'
              }
              alt={`${channel.snippet?.title} thumbnail`}
              width={24}
              height={24}
            />
            <div className='text-center text-gray-700 font-semibold'>
              {channel.snippet?.title}
            </div>
          </Link>
        )}
        <Link href={url} className='flex items-center space-x-2'>
          <div className='flex text-gray-700 space-x-1'>
            <MdOutlineVisibility size={20} className='self-end' />
            <div className='text-center'>
              {stringifyCount(video.statistics?.viewCount || '0', 2)}
            </div>
          </div>
          <div className='text-gray-400'>&bull;</div>
          <div className='flex text-gray-700 space-x-1'>
            <MdCalendarToday size={20} className='self-end' />
            <div className='text-center'>
              {video.snippet?.publishedAt
                ? stringifyDateRelatively(video.snippet?.publishedAt)
                : 'No publish information found'}
            </div>
          </div>
          <div className='text-gray-400'>&bull;</div>
          <div className='flex text-gray-700 space-x-1'>
            <MdThumbUp size={20} className='self-end' />
            <div className='text-center'>
              {stringifyCount(video.statistics?.likeCount || '0', 0)}
            </div>
          </div>
        </Link>
        <Link href={url}>
          <div className='pr-8 text-gray-700 text-sm'>
            {video.snippet?.description?.substring(0, 200)}
            {video.snippet?.description?.length &&
            video.snippet?.description?.length > 200
              ? '...'
              : ''}
          </div>
        </Link>
      </div>
    </ResultCard>
  )
}
