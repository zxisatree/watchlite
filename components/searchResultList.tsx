'use client'

import SearchResult from './searchResult'
import { FullSearchResult } from '../app/types'

type SearchProps = {
  fullResults: FullSearchResult[] | null
}

export default function SearchResultList({ fullResults }: SearchProps) {
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
