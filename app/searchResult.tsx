import Image from 'next/image'
import Link from 'next/link'
import { MdOutlineVisibility, MdCalendarToday, MdThumbUp } from 'react-icons/md'

type FullSearchResult = {
  searchResult: gapi.client.youtube.SearchResult
  video?: gapi.client.youtube.Video
  channel?: gapi.client.youtube.Channel
}

type SearchResultProps = {
  fullResult: FullSearchResult
}

function stringifyCount(countResponse: string, decimalPlaces: number = 2) {
  const parsedCount = Number.parseInt(countResponse)

  if (parsedCount < 1000) {
    return parsedCount.toString()
  }

  const cutoffs = [1000, 1000 ** 2, 1000 ** 3, 1000 ** 4]
  const prefixIndex = cutoffs.findLastIndex(cutoff => parsedCount >= cutoff)
  const prefixes = ['K', 'M', 'B', 'T']
  return (
    (parsedCount / cutoffs[prefixIndex]).toFixed(decimalPlaces) +
    prefixes[prefixIndex]
  )
}

/**
 * Taken from https://gist.github.com/LewisJEllis/9ad1f35d102de8eee78f6bd081d486ad
 */
function stringifyDateRelativelyFactory(lang = 'en') {
  const cutoffs = [
    60,
    3600,
    86400,
    86400 * 7,
    86400 * 30,
    86400 * 365,
    Infinity,
  ]
  const units: Intl.RelativeTimeFormatUnit[] = [
    'second',
    'minute',
    'hour',
    'day',
    'week',
    'month',
    'year',
  ]
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  return function stringifyDateRelatively(dateString: string): string {
    const date = new Date(dateString)
    const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000)
    const unitIndex = cutoffs.findIndex(
      cutoff => cutoff > Math.abs(deltaSeconds),
    )
    const divisor = unitIndex ? cutoffs[unitIndex - 1] : 1
    return rtf.format(Math.round(deltaSeconds / divisor), units[unitIndex])
  }
}

const stringifyDateRelatively = stringifyDateRelativelyFactory()

export default function SearchResult({ fullResult }: SearchResultProps) {
  const defaultVideoThumbnail =
    fullResult.searchResult.snippet?.thumbnails?.high
  const defaultChannelThumbnail =
    fullResult.channel?.snippet?.thumbnails?.default
  const defaultUrl = defaultVideoThumbnail?.url
  // console.log(fullResult.searchResult.snippet)
  return (
    <Link
      href={`/play?v=${fullResult.searchResult.id?.videoId}`}
      className='w-[70%] p-2 border-black border flex flex-row'
    >
      <div className='w-[30%] flex-shrink-0 flex-grow-0'>
        <div className='w-[95%]'>
          <Image
            src={defaultUrl || 'default_thumbnail.png'}
            alt={`${fullResult.searchResult.snippet?.title}thumbnail`}
            width={defaultVideoThumbnail ? defaultVideoThumbnail.width : 480}
            height={defaultVideoThumbnail ? defaultVideoThumbnail.height : 360}
          />
        </div>
      </div>
      <div className='w-[70%]'>
        <h5 className='flex-shrink-0 flex-grow-0 mb-2 text-xl font-bold'>
          {fullResult.searchResult.snippet?.title || 'Title not found'}
        </h5>
        <div
          // href={fullResult.channel?.snippet?.customUrl || ''}
          className='flex space-x-2'
        >
          <Image
            className='rounded-full aspect-square object-cover'
            src={defaultChannelThumbnail?.url || 'default_thumbnail.png'}
            alt={`${fullResult.searchResult.snippet?.channelTitle}thumbnail`}
            width={24}
            height={24}
          />
          <div className='text-center'>
            {fullResult.searchResult.snippet?.channelTitle}
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
        <div className='relative pr-8 text-gray-700 text-md'>
          {fullResult.searchResult.snippet?.description}
        </div>
      </div>
    </Link>
  )
}
