import ChannelHead from '@/components/channelHead'
import LoadingSpinner from '@/components/loadingSpinner'
import VideoCard from '@/components/videoCard'
import {
  stripLeadingAt,
  isNotUndefined,
  handleNextPageResponsesNode,
  isNotNull,
  thumbnailDetailsAdapter,
  channelAdapter,
  videoAdapter,
} from '../utils'
import { yt } from '../googleapisUtils'

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const parsedChannelHandle = stripLeadingAt(decodeURIComponent(slug))

  const channelResponse = await yt.channels
    .list({
      part: ['snippet', 'contentDetails', 'statistics'],
      forHandle: parsedChannelHandle,
    })
    .then(response => {
      return response.data.items
    })

  if (!channelResponse || channelResponse.length > 1) {
    console.error(
      `unexpected number of items (not 1): ${channelResponse?.length}`,
    )
    return (
      <div>
        error:{' '}
        {`unexpected number of items (not 1): ${channelResponse?.length}`}
      </div>
    )
  }

  const channel = channelResponse[0]
  const baseParams = {
    part: ['snippet'],
    playlistId: channel.contentDetails?.relatedPlaylists?.uploads,
  }
  const playlistItems = await yt.playlistItems
    .list(baseParams)
    .then(response =>
      handleNextPageResponsesNode(
        response,
        yt.playlistItems.list.bind(yt.playlistItems),
        baseParams,
        50,
      ),
    )

  if (playlistItems.length === 0) {
    console.error('no playlist items found')
    return <div>no playlist items found</div>
  }

  const videoIds = playlistItems
    .map(item => item.snippet?.resourceId?.videoId)
    .filter(isNotNull)
    .filter(isNotUndefined)
  const videoLists = []
  for (let i = 0; i < videoIds.length; i += 50) {
    videoLists.push(
      yt.videos
        .list({
          part: ['snippet', 'contentDetails', 'statistics'],
          id: videoIds.slice(i, i + 50),
        })
        .then(response => response.data.items || []),
    )
  }
  const videos = (await Promise.all(videoLists)).flat()

  return (
    <div className='m-4 space-y-4'>
      {channel ? (
        <div className='flex flex-col justify-center items-center space'>
          <ChannelHead channel={channelAdapter(channel)} />
          {videos.length > 0 ? (
            videos.map(video => (
              <VideoCard
                key={video.id}
                thumbnailDetails={thumbnailDetailsAdapter(
                  video.snippet?.thumbnails,
                )}
                video={videoAdapter(video)}
                channel={channelAdapter(channel)}
              />
            ))
          ) : (
            <LoadingSpinner />
          )}
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  )
}
