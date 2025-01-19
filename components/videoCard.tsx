import Image from 'next/image'
import Link from 'next/link'
import { MdOutlineVisibility, MdCalendarToday, MdThumbUp } from 'react-icons/md'
import { stringifyCount, stringifyDateRelatively } from '../app/utils'

type VideoCardProps = {
  thumbnailDetails: gapi.client.youtube.ThumbnailDetails | undefined
  video: gapi.client.youtube.Video
  channel: gapi.client.youtube.Channel
}

export default function VideoCard({
  thumbnailDetails,
  video,
  channel,
}: VideoCardProps) {
  const defaultVideoThumbnail = thumbnailDetails?.high
  const defaultChannelThumbnail = thumbnailDetails?.default
  const defaultUrl = defaultVideoThumbnail?.url
  return (
    <Link
      href={`/watch?v=${video.id}`}
      className='w-[70%] p-2 border-black border flex flex-row'
    >
      <div className='w-[30%] flex-shrink-0 flex-grow-0'>
        <div className='w-[95%]'>
          <Image
            src={defaultUrl || '/default_thumbnail.png'}
            alt={`${video.snippet?.title} thumbnail`}
            width={defaultVideoThumbnail ? defaultVideoThumbnail.width : 480}
            height={defaultVideoThumbnail ? defaultVideoThumbnail.height : 360}
          />
        </div>
      </div>
      <div className='w-[70%]'>
        <h5 className='flex-shrink-0 flex-grow-0 mb-2 text-xl font-bold'>
          {video.snippet?.title || 'Title not found'}
        </h5>
        <div
          // href={fullResult.channel?.snippet?.customUrl || ''}
          className='flex space-x-2'
        >
          <Image
            className='rounded-full aspect-square object-cover'
            src={defaultChannelThumbnail?.url || '/default_thumbnail.png'}
            alt={`${channel.snippet?.title} thumbnail`}
            width={24}
            height={24}
          />
          <div className='text-center'>{channel.snippet?.title}</div>
        </div>
        <div className='flex items-center space-x-2'>
          <div className='flex space-x-1'>
            <MdOutlineVisibility size={20} className='self-end' />
            <div className='text-center'>
              {stringifyCount(video.statistics?.viewCount || '0', 2)}
            </div>
          </div>
          <div className='text-gray-400'>&bull;</div>
          <div className='flex space-x-1'>
            <MdCalendarToday size={20} className='self-end' />
            <div className='text-center'>
              {video.snippet?.publishedAt
                ? stringifyDateRelatively(video.snippet?.publishedAt)
                : 'No publish information found'}
            </div>
          </div>
          <div className='text-gray-400'>&bull;</div>
          <div className='flex space-x-1'>
            <MdThumbUp size={20} className='self-end' />
            <div className='text-center'>
              {stringifyCount(video.statistics?.likeCount || '0', 0)}
            </div>
          </div>
        </div>
        <div className='pr-8 text-gray-700 text-sm'>
          {video.snippet?.description}
        </div>
      </div>
    </Link>
  )
}
