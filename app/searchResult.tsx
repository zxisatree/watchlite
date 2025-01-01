import Image from 'next/image'
import Link from 'next/link'
import { MdOutlineVisibility, MdCalendarToday, MdThumbUp } from 'react-icons/md'

type SearchResultProps = {
  result: gapi.client.youtube.SearchResult
}

export default function SearchResult({ result }: SearchResultProps) {
  const defaultThumbnail = result.snippet?.thumbnails?.high
  const defaultUrl = defaultThumbnail?.url
  console.log(result.snippet)
  return (
    <Link
      href={`/play?v=${result.id?.videoId}`}
      className='w-[70%] p-2 border-black border flex flex-row'
    >
      <div className='w-[30%] flex-shrink-0 flex-grow-0'>
        <div className='w-[95%]'>
          <Image
            src={defaultUrl || 'default_thumbnail.png'}
            alt={`${result.snippet?.title}thumbnail`}
            width={defaultThumbnail ? defaultThumbnail.width : 480}
            height={defaultThumbnail ? defaultThumbnail.height : 360}
          />
        </div>
      </div>
      <div className='w-[70%]'>
        <h5 className='flex-shrink-0 flex-grow-0 mb-2 text-xl font-bold'>
          {result.snippet?.title || 'Title not found'}
        </h5>
        {/* Channel here */}
        <div className='flex'>{result.snippet?.channelTitle}</div>
        <div className='flex items-center space-x-2'>
          <div className='flex space-x-1'>
            <MdOutlineVisibility size={20} className='self-end' />
            <div className='text-center'>1.1K</div>
          </div>
          <div className='text-gray-400'>&bull;</div>
          <div className='flex space-x-1'>
            <MdCalendarToday size={20} className='self-end' />
            <div className='text-center'>Today</div>
          </div>
          <div className='text-gray-400'>&bull;</div>
          <div className='flex space-x-1'>
            <MdThumbUp size={20} className='self-end' />
            <div className='text-center'>261</div>
          </div>
        </div>
        <div className='relative pr-8 text-gray-700 text-md'>
          {result.snippet?.description}
        </div>
      </div>
    </Link>
  )
}
