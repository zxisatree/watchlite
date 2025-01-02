'use client'

import Search from './search'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import {
  initGapi,
  sendChannelThumbnailRequest,
  sendQueryRequest,
  sendVideoStatsRequest,
} from './query'

type SearchPageProps = {
  apiKey: string
}

type FullSearchResult = {
  searchResult: gapi.client.youtube.SearchResult
  video?: gapi.client.youtube.Video
  channel?: gapi.client.youtube.Channel
}

function init(
  apiKey: string,
  setIsInitialised: Dispatch<SetStateAction<boolean>>,
) {
  console.log('initialising...')
  initGapi(apiKey, setIsInitialised)
}

function sendQuery(
  searchQuery: string,
  setSearchResults: Dispatch<
    SetStateAction<gapi.client.youtube.SearchResult[] | null>
  >,
) {
  sendQueryRequest(searchQuery, setSearchResults)
}

export default function SearchPage({ apiKey }: SearchPageProps) {
  const [isInitialised, setIsInitialised] = useState(false)
  const [searchQuery, setSearchQuery] = useState('types of coffee')
  const [searchResults, setSearchResults] = useState<
    gapi.client.youtube.SearchResult[] | null
  >(null)
  const [videoResults, setVideoResults] = useState<
    gapi.client.youtube.Video[] | null
  >(null)
  const [channelResults, setChannelResults] = useState<
    gapi.client.youtube.Channel[] | null
  >(null)
  const [fullResults, setFullResults] = useState<FullSearchResult[] | null>(
    null,
  )

  //   console.log('searchResults:')
  //   console.log(searchResults)
  //   console.log('videoResults:')
  //   console.log(videoResults)
  //   console.log('channelResults:')
  //   console.log(channelResults)
  //   console.log('fullResults:')
  //   console.log(fullResults)

  useEffect(() => {
    if (searchResults && searchResults.length) {
      sendVideoStatsRequest(
        searchResults
          .map(searchResult => searchResult.id?.videoId)
          .filter(videoId => videoId !== undefined),
        setVideoResults,
      )

      sendChannelThumbnailRequest(
        searchResults
          .map(searchResult => searchResult.snippet?.channelId)
          .filter(channelId => channelId !== undefined),
        setChannelResults,
      )
    }
  }, [searchResults])

  // Only handles videos
  useEffect(() => {
    if (
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
  }, [searchResults, videoResults, channelResults])

  return (
    <div>
      <div className='sticky top-0 flex flex-row p-8'>
        <button
          type='button'
          className='focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 disabled:bg-red-300'
          onClick={() => init(apiKey, setIsInitialised)}
          disabled={isInitialised}
        >
          {isInitialised ? 'Initialised!' : 'Initialise'}
        </button>
        <input
          type='text'
          className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
          placeholder={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button
          type='button'
          className='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'
          onClick={() => sendQuery(searchQuery, setSearchResults)}
          disabled={!isInitialised}
        >
          Send query
        </button>
      </div>
      <div className='flex flex-col justify-center items-center'>
        <Search fullResults={fullResults} />
      </div>
    </div>
  )
}
