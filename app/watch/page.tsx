'use client'
import { useSearchParams } from 'next/navigation'
import YouTube from 'react-youtube'
import { scaleWidthAndHeight, stringifyDateRelatively } from '@/app/utils'
import { fetchPlaylistItems, loadComments } from '../utils'
import { useContext, useEffect, useState } from 'react'
import { GapiContext } from '../gapiCtxt'
import { VideoListInfo } from '../types'
import Link from 'next/link'
import LoadingSpinner from '@/components/loadingSpinner'

export default function WatchPage() {
  const { gapiIsInitialised } = useContext(GapiContext)
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v') || ''
  const playlistId = searchParams.get('list') || ''
  const [video, setVideo] = useState<gapi.client.youtube.VideoSnippet | null>(
    null,
  )
  const [channel, setChannel] =
    useState<gapi.client.youtube.ChannelSnippet | null>(null)
  const [comments, setComments] = useState<gapi.client.youtube.Comment[]>([])
  const [playlistSnippet, setPlaylistSnippet] =
    useState<gapi.client.youtube.PlaylistSnippet | null>(null)
  const [playlist, setPlaylist] = useState<VideoListInfo>({
    videos: [],
    channels: {},
  })
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false)

  // console.log(playlist)
  // console.log(video)

  useEffect(() => {
    if (gapiIsInitialised && videoId !== '') {
      gapi.client.youtube.videos
        .list({
          part: 'snippet,statistics',
          id: videoId,
        })
        .then(response => {
          const video = response.result?.items?.[0]?.snippet
          if (video) {
            setVideo(video)
          }

          gapi.client.youtube.channels
            .list({
              part: 'snippet',
              id: video?.channelId,
            })
            .then(response => {
              const channel = response.result?.items?.[0]?.snippet
              if (channel) {
                setChannel(channel)
              }
            })
        })

      if (playlistId) {
        setIsPlaylistLoading(true)
        fetchPlaylistItems(playlistId, setPlaylist, setIsPlaylistLoading)
        gapi.client.youtube.playlists
          .list({
            part: 'snippet',
            id: playlistId,
          })
          .then(response => {
            const playlist = response.result?.items?.[0]?.snippet
            if (playlist) {
              setPlaylistSnippet(playlist)
            }
          })
      }
    }
  }, [gapiIsInitialised, videoId, playlistId])

  if (!video) {
    return <div>Loading...</div>
  } else if (videoId === '') {
    return <div>No video found. Video ID might be empty.</div>
  }
  return (
    <div className='w-full h-full flex flex-col justify-center items-center p-2 mb-10'>
      <div className='flex'>
        <YouTube videoId={videoId} opts={scaleWidthAndHeight(2)} />
        {playlistId && (
          <div className='ml-6 p-2 rounded-lg bg-gray-600'>
            {isPlaylistLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className='text-xl font-bold text-gray-100'>
                  {playlistSnippet?.title}
                </div>
                {playlist.videos.map(video => {
                  let cardStyles
                  if (video.id === videoId) {
                    cardStyles =
                      'p-1 my-1 flex flex-row bg-gray-300 border border-gray-400 rounded-lg hover:bg-gray-400 transition-colors'
                  } else {
                    cardStyles =
                      'p-1 my-1 flex flex-row bg-gray-50 border border-gray-400 rounded-lg hover:bg-gray-400 transition-colors'
                  }
                  return (
                    <Link
                      className={cardStyles}
                      href={`/watch?v=${video.id}&list=${playlistId}`}
                      key={video.id}
                    >
                      {video.snippet?.title}
                    </Link>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>
      <div>
        <h1 className='text-5xl font-bold my-2'>{video.title}</h1>
        <Link
          className='text-2xl text-gray-500 hover:text-gray-700'
          href={`/${channel?.customUrl}`}
        >
          {video.channelTitle}
        </Link>
        <div className='text-xl pb-1 border-b border-black'>
          {stringifyDateRelatively(video.publishedAt || '')}
        </div>
        <div className='text-lg whitespace-pre-wrap overflow-hidden'>
          {video.description}
        </div>
        <div className='text-2xl my-4'>Comments</div>
        {comments.map(comment => (
          <div
            key={comment.id}
            className='border border-gray-500 rounded-md p-2 my-2'
          >
            <div className='font-bold'>
              {comment.snippet?.authorDisplayName}
            </div>
            <div>{comment.snippet?.textOriginal}</div>
          </div>
        ))}
        <button
          className='border w-full bg-gray-100 text-gray-800 disabled:bg-white disabled:text-gray-400'
          onClick={() => loadComments(videoId, setComments)}
          disabled={!gapiIsInitialised || comments.length > 0}
        >
          Load comments...
        </button>
      </div>
    </div>
  )
}
