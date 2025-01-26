'use client'

import { useContext, useEffect, useState } from 'react'
import {
  keySearchResultById,
  sendChannelListRequest,
  sendSearchListRequest,
  sendVideoStatsRequest,
} from '../utils'
import { FullSearchResult } from '../types'
import { useSearchParams } from 'next/navigation'
import { GapiContext } from '../gapiCtxt'
import SearchResult from '@/components/searchResult'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('search_query')
  const { gapiIsInitialised } = useContext(GapiContext)

  const [searchResults, setSearchResults] = useState<
    gapi.client.youtube.SearchResult[]
  >([])
  const [videoResults, setVideoResults] = useState<gapi.client.youtube.Video[]>(
    [],
  )
  const [channelResults, setChannelResults] = useState<
    gapi.client.youtube.Channel[]
  >([])
  const [fullResults, setFullResults] = useState<FullSearchResult[]>([])

  useEffect(() => {
    if (gapiIsInitialised && query) {
      sendSearchListRequest(query, setSearchResults)
    }
  }, [gapiIsInitialised, query])

  useEffect(() => {
    if (gapiIsInitialised && searchResults && searchResults.length) {
      sendVideoStatsRequest(
        searchResults
          .map(searchResult => searchResult.id?.videoId)
          .filter(videoId => videoId !== undefined),
        setVideoResults,
      )

      sendChannelListRequest(
        searchResults
          .map(searchResult => searchResult.snippet?.channelId)
          .filter(channelId => channelId !== undefined),
        setChannelResults,
      )
    }
  }, [gapiIsInitialised, searchResults])

  // Only handles videos
  useEffect(() => {
    if (
      gapiIsInitialised &&
      searchResults &&
      searchResults.length &&
      videoResults &&
      videoResults.length &&
      channelResults &&
      channelResults.length
    ) {
      // key videoResults by videoId
      // for each search result, check if it has a videoResult, then combine it into a FullSearchResult
      const videoIdToResult = new Map()
      for (const videoResult of videoResults) {
        videoIdToResult.set(videoResult.id, videoResult)
      }

      const channelIdToResult = new Map()
      for (const channelResult of channelResults) {
        channelIdToResult.set(channelResult.id, channelResult)
      }

      setFullResults(
        searchResults.map(searchResult => {
          const searchResultVideoId = searchResult.id?.videoId
          const searchResultChannelId = searchResult.snippet?.channelId
          const result: FullSearchResult = { searchResult }
          if (videoIdToResult.has(searchResultVideoId)) {
            result.video = videoIdToResult.get(searchResultVideoId)
          }
          if (channelIdToResult.has(searchResultChannelId)) {
            result.channel = channelIdToResult.get(searchResultChannelId)
          }

          return result
        }),
      )
    }
  }, [gapiIsInitialised, searchResults, videoResults, channelResults])

  if (query === null || query === '') {
    return <div>Query is empty, enter a search query into the search bar!</div>
  }

  return (
    <div className='flex flex-col justify-center items-center mt-2'>
      {fullResults?.map(result => (
        <SearchResult key={keySearchResultById(result)} fullResult={result} />
      ))}
    </div>
  )
}
