'use client'

import { useContext, useEffect, useState } from 'react'
import {
  isNotUndefined,
  keySearchResultById,
  sendChannelListRequest,
  sendPlaylistItemsListRequest,
  sendSearchListRequest,
  sendVideoListRequest,
} from '../utils'
import { FullSearchResult, PlaylistItemInfo } from '../types'
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
  const [playlistResults, setPlaylistResults] = useState<
    Map<string, PlaylistItemInfo[]>
  >(new Map())
  const [fullResults, setFullResults] = useState<FullSearchResult[]>([])

  const searchVideoResults = searchResults
    .map(searchResult => searchResult.id?.videoId)
    .filter(isNotUndefined)
  const searchChannelResults = searchResults
    .map(searchResult => searchResult.snippet?.channelId)
    .filter(isNotUndefined)
  const searchPlaylistResults = searchResults
    .map(searchResult => searchResult.id?.playlistId)
    .filter(isNotUndefined)

  useEffect(() => {
    if (gapiIsInitialised && query) {
      sendSearchListRequest(query, setSearchResults)
    }
  }, [gapiIsInitialised, query])

  useEffect(() => {
    if (gapiIsInitialised && searchResults && searchResults.length) {
      sendVideoListRequest(searchVideoResults, setVideoResults)
      sendChannelListRequest(searchChannelResults, setChannelResults)
      sendPlaylistItemsListRequest(searchPlaylistResults, setPlaylistResults)
    }
  }, [gapiIsInitialised, searchResults])

  // Only handles videos
  useEffect(() => {
    const validVideoResults =
      searchVideoResults.length === 0 || videoResults.length
    const validChannelResults =
      searchChannelResults.length === 0 || channelResults.length
    const validPlaylistResults =
      searchPlaylistResults.length === 0 || playlistResults.size
    if (
      gapiIsInitialised &&
      validVideoResults &&
      validChannelResults &&
      validPlaylistResults
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

      const playlistIdToResult = new Map()
      for (const [playlistId, playlistResult] of playlistResults) {
        playlistIdToResult.set(playlistId, playlistResult)
      }

      setFullResults(
        searchResults.map(searchResult => {
          const searchResultVideoId = searchResult.id?.videoId
          const searchResultChannelId = searchResult.snippet?.channelId
          const searchResultPlaylistId = searchResult.id?.playlistId
          const result: FullSearchResult = { searchResult }
          if (videoIdToResult.has(searchResultVideoId)) {
            result.video = videoIdToResult.get(searchResultVideoId)
          }
          if (channelIdToResult.has(searchResultChannelId)) {
            result.channel = channelIdToResult.get(searchResultChannelId)
          }
          if (playlistIdToResult.has(searchResultPlaylistId)) {
            result.playlistItemInfos = playlistIdToResult.get(
              searchResultPlaylistId,
            )
          }

          return result
        }),
      )
    }
  }, [
    gapiIsInitialised,
    searchResults,
    videoResults,
    channelResults,
    playlistResults,
  ])

  if (query === null || query === '') {
    return <div>Query is empty, enter a search query into the search bar!</div>
  }

  console.log('search results:')
  console.log(searchResults)
  console.log('fullResults:')
  console.log(fullResults)

  return (
    <div className='flex flex-col justify-center items-center mt-2'>
      {fullResults?.map(result => (
        <SearchResult key={keySearchResultById(result)} fullResult={result} />
      ))}
    </div>
  )
}
