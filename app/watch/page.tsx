'use client'
import { useSearchParams } from 'next/navigation'
import YouTube from 'react-youtube'
import {
  isNotUndefined,
  scaleWidthAndHeight,
  stringifyDateRelatively,
} from '@/app/utils'
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { EnvContext } from '../ctxt'

/** Limit to 50 comments for now */
function loadComments(
  videoId: string,
  setComments: Dispatch<SetStateAction<gapi.client.youtube.Comment[]>>,
) {
  gapi.client.youtube.commentThreads
    .list({
      part: 'snippet',
      videoId: videoId,
    })
    .then(response => {
      const comments = response.result?.items
        ?.map(item => item.snippet?.topLevelComment)
        .filter(isNotUndefined)
      if (comments) {
        setComments(comments)
      }
    })
}

export default function Play() {
  const { gapiIsInitialised } = useContext(EnvContext)
  const searchParams = useSearchParams()
  // TODO: handle case where videoId is not found
  const videoId = searchParams.get('v') || 'eeZzCoghZzw'
  const [video, setVideo] = useState<gapi.client.youtube.VideoSnippet | null>(
    null,
  )
  const [comments, setComments] = useState<gapi.client.youtube.Comment[]>([])
  console.log(video)

  useEffect(() => {
    if (gapiIsInitialised) {
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
        })
    }
  }, [gapiIsInitialised])

  if (!video) {
    return <div>Loading...</div>
  }
  return (
    <div className='w-full h-full flex flex-col justify-center items-center p-2 mb-10'>
      <YouTube videoId={videoId} opts={scaleWidthAndHeight(2)} />
      <div>
        <h1 className='text-5xl font-bold'>{video.title}</h1>
        <div className='text-2xl'>{video.channelTitle}</div>
        <div className='text-xl'>
          {stringifyDateRelatively(video.publishedAt || '')}
        </div>
        <div className='text-lg'>{video.description}</div>
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
