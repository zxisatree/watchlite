import { parse8601PtTime } from '@/app/utils'
import Link from 'next/link'
import ResultCard from './resultCard'
import Image from 'next/image'
import { PlaylistItemInfo } from '@/app/types'

export default function PlaylistCard({
  searchResult,
  channel,
  playlistItemInfos,
}: {
  searchResult: gapi.client.youtube.SearchResult
  channel: gapi.client.youtube.Channel
  playlistItemInfos: PlaylistItemInfo[]
}) {
  const firstItem = playlistItemInfos[0]
  const firstPlaylistItem = firstItem.playlistItem
  const videoId = firstPlaylistItem.contentDetails?.videoId
  const playlistId = searchResult.id?.playlistId
  const firstVideoUrl = `/watch?v=${videoId}&link=${playlistId}`

  return (
    <ResultCard>
      <Link
        href={firstVideoUrl}
        className='w-[420px] h-[300px] flex-shrink-0 flex-grow-0 relative'
      >
        <Image
          className='p-2 rounded-2xl'
          src={
            searchResult.snippet?.thumbnails?.high?.url ||
            '/default_thumbnail.png'
          }
          alt={`${searchResult.snippet?.title} thumbnail`}
          layout='fill'
          objectFit='cover'
          // width={defaultVideoThumbnail ? defaultVideoThumbnail.width : 480}
          // height={defaultVideoThumbnail ? defaultVideoThumbnail.height : 360}
        />
      </Link>
      {/* Unflex */}
      <div className='py-2 space-y-2'>
        <Link href={firstVideoUrl} className='mb-2 text-xl font-bold text-wrap'>
          {firstPlaylistItem?.snippet?.title || 'Title not found'}
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
            <div className='text-gray-400'>&bull;</div>
            <div className='text-center text-gray-700'>Playlist</div>
          </Link>
        )}
        <div className='flex flex-col'>
          {playlistItemInfos.slice(0, 2).map(playlistItemInfo => {
            const playlistItem = playlistItemInfo.playlistItem
            return (
              <Link
                key={playlistItem.id}
                href={`/watch?v=${playlistItem.contentDetails?.videoId}&link=${playlistId}`}
                className='text-gray-500 hover:text-gray-800'
              >
                {playlistItem.snippet?.title} &bull;
                {playlistItemInfo.video.contentDetails?.duration
                  ? '  ' +
                    parse8601PtTime(
                      playlistItemInfo.video.contentDetails?.duration,
                    )
                  : '  Unknown time'}
              </Link>
            )
          })}
          <Link
            href={`/playlist?list=${playlistId}`}
            className='mt-4 font-semibold text-gray-600 hover:text-gray-800'
          >
            View full playlist
          </Link>
        </div>
      </div>
    </ResultCard>
  )
}
