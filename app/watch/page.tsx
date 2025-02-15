import { fetchSinglePlaylistItems, yt } from '@/utils/googleapisUtils'
import {
  channelSnippetAdapter,
  playlistSnippetAdapter,
  videoSnippetAdapter,
} from '@/utils/utils'
import WatchPage from './watchPage'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ v: string; list?: string }>
}) {
  const params = await searchParams
  const videoId = params.v
  const playlistId = params.list

  if (videoId === '') {
    return <div>No video found. Video ID might be empty.</div>
  }

  const video = await yt.videos
    .list({
      part: ['snippet', 'statistics'],
      id: [videoId],
    })
    .then(response => {
      const video = response.data.items?.[0]?.snippet
      return video
    })

  if (!video) {
    return <div>Loading...</div>
  }

  const channelId = video.channelId
  if (!channelId) {
    return <div>No channel ID found. Channel ID might be empty.</div>
  }

  const channel = await yt.channels
    .list({
      part: ['snippet'],
      id: [channelId],
    })
    .then(response => {
      const channel = response.data.items?.[0]?.snippet
      return channel
    })

  if (!channel) {
    return <div>No channel found.</div>
  }

  // Should error if playlistId is empty
  const playlistSnippet = playlistId
    ? await yt.playlists
        .list({
          part: ['snippet'],
          id: [playlistId],
        })
        .then(response => {
          const playlist = response.data.items?.[0]?.snippet
          return playlist
        })
    : null

  if (playlistId && playlistSnippet) {
    const playlist = await fetchSinglePlaylistItems(playlistId)

    return (
      <WatchPage
        video={videoSnippetAdapter(video)}
        channel={channelSnippetAdapter(channel)}
        playlist={playlist}
        playlistSnippet={playlistSnippetAdapter(playlistSnippet)}
      />
    )
  } else {
    return (
      <WatchPage
        video={videoSnippetAdapter(video)}
        channel={channelSnippetAdapter(channel)}
      />
    )
  }
}
