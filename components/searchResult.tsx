import { FullSearchResult } from '../app/types'
import VideoCard from './videoCard'
import ResultCard from './resultCard'
import PlaylistCard from './playlistCard'
import ChannelCard from './channelCard'
import {
  isChannelSearchResult,
  isPlaylistSearchResult,
  isVideoSearchResult,
} from '@/app/utils'

export default function SearchResult({
  searchResult,
}: {
  searchResult: FullSearchResult
}) {
  if (isVideoSearchResult(searchResult)) {
    return (
      <VideoCard
        video={searchResult.video}
        channel={searchResult.channel}
        thumbnailDetails={searchResult.video.snippet?.thumbnails}
      />
    )
  } else if (isPlaylistSearchResult(searchResult)) {
    return (
      <PlaylistCard
        searchResult={searchResult.searchResult}
        channel={searchResult.channel}
        playlistItemInfos={searchResult.playlistItemInfos}
      />
    )
  } else if (isChannelSearchResult(searchResult)) {
    return <ChannelCard channel={searchResult.channel} />
  } else {
    return (
      <ResultCard>
        <div>Not a valid search result</div>
      </ResultCard>
    )
  }
}
