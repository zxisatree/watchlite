'use client'

import SearchResult from './searchResult'

type FullSearchResult = {
  searchResult: gapi.client.youtube.SearchResult
  video?: gapi.client.youtube.Video
  channel?: gapi.client.youtube.Channel
}

type SearchProps = {
  fullResults: FullSearchResult[] | null
}

export default function Search({ fullResults }: SearchProps) {
  // Will return empty string if result.is is null
  function keyResultById(result: FullSearchResult): string {
    return [
      result.searchResult.id?.channelId,
      result.searchResult.id?.playlistId,
      result.searchResult.id?.videoId,
    ]
      .filter(Boolean)
      .join()
  }
  return (
    <>
      {fullResults?.map(result => (
        <SearchResult key={keyResultById(result)} fullResult={result} />
      ))}
    </>
  )
}
