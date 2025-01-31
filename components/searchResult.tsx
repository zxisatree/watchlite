import { FullSearchResult } from '../app/types'
import VideoCard from './videoCard'
import ResultCard from './resultCard'
import PlaylistCard from './playlistCard'
import ChannelCard from './channelCard'

export default function SearchResult({
  fullResult,
}: {
  fullResult: FullSearchResult
}) {
  const video = fullResult.video
  const channel = fullResult.channel
  const playlistItemInfos = fullResult.playlistItemInfos

  if (video) {
    return (
      <VideoCard
        video={video}
        channel={channel}
        thumbnailDetails={fullResult.video?.snippet?.thumbnails}
      />
    )
  } else if (playlistItemInfos) {
    // TODO: check that search result and channel always exists
    return (
      <PlaylistCard
        searchResult={fullResult.searchResult!}
        channel={channel!}
        playlistItemInfos={playlistItemInfos}
      />
    )
  } else if (channel) {
    return <ChannelCard channel={channel} />
  } else {
    return (
      <ResultCard>
        <div>Not a valid search result</div>
      </ResultCard>
    )
  }
}
