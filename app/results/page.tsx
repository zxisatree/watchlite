'use client'

import { useContext, useEffect, useState } from 'react'
import { fetchSearchResults, keySearchResultById } from '../utils'
import { FullSearchResult } from '../types'
import { useSearchParams } from 'next/navigation'
import { GapiContext } from '../gapiCtxt'
import SearchResult from '@/components/searchResult'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('search_query')
  const { gapiIsInitialised } = useContext(GapiContext)
  const [searchResults, setSearchResults] = useState<FullSearchResult[]>([])

  useEffect(() => {
    if (gapiIsInitialised && query) {
      fetchSearchResults(query, setSearchResults)
    }
  }, [gapiIsInitialised, query])

  if (query === null || query === '') {
    return <div>Query is empty, enter a search query into the search bar!</div>
  }

  // console.log('searchResults:')
  // console.log(searchResults)

  return (
    <div className='flex flex-col justify-center items-center mt-2'>
      {searchResults?.map(result => (
        <SearchResult key={keySearchResultById(result)} searchResult={result} />
      ))}
    </div>
  )
}
