'use client'

import SearchResultList from '../components/searchResultList'
import { useContext, useEffect, useState } from 'react'
import {
  sendSubscriptionsListRequest,
  sendChannelThumbnailRequest,
  sendQueryRequest,
  sendVideoStatsRequest,
} from './utils'
import { useRouter } from 'next/navigation'
import { EnvContext } from './ctxt'
import { FullSearchResult, OauthTokenState } from './types'

export default function SearchPage() {
  const router = useRouter()
  const { GAPI_CLIENT_ID, gapiIsInitialised } = useContext(EnvContext)
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
  const [subscriptions, setSubscriptions] = useState<
    gapi.client.youtube.Subscription[] | null
  >(null)
  const [oauthToken, setOauthToken] = useState<OauthTokenState | null>(null)

  useEffect(() => {
    console.log(`searchPage gapiIsInitialised: ${gapiIsInitialised}`)
  }, [gapiIsInitialised])

  useEffect(() => {
    const oauthError = localStorage.getItem('oauthError')
    const oauthTokenRaw = localStorage.getItem('oauthToken')
    const oauthTokenState: OauthTokenState =
      oauthTokenRaw !== null && JSON.parse(oauthTokenRaw)
    if (oauthError !== null) {
      console.error(oauthError)
      localStorage.removeItem('oauthError')
    }
    if (oauthTokenRaw !== null) {
      console.log('Acquired oauth token:')
      console.log(oauthTokenState)
      setOauthToken(oauthTokenState)
    }
  }, [])

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

  function oauthRedirect() {
    const state = 'test_oauth'
    const client_id = GAPI_CLIENT_ID
    const callback_link = 'http://localhost:3000/oauth2callback'
    const link = `https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/youtube.readonly&response_type=code&access_type=offline&state=${state}&redirect_uri=${callback_link}&client_id=${client_id}`
    console.log(`client_id: ${client_id}`)
    router.push(link)
  }

  return (
    <div>
      <div className='sticky top-0 flex flex-row p-8'>
        <button
          type='button'
          className='focus:outline-none text-white bg-yellow-700 hover:bg-yellow-800 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:focus:ring-yellow-900 disabled:bg-yellow-300'
          onClick={oauthRedirect}
          // disabled={!gapiIsInitialised}
        >
          OAuth
        </button>
        <button
          type='button'
          className='focus:outline-none text-white bg-red-700 enabled:hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-600 enabled:dark:hover:bg-red-700 dark:focus:ring-red-900 disabled:bg-red-300'
          // onClick={() => initGapi(GAPI_API_KEY || '', setIsInitialised)}
          disabled={gapiIsInitialised}
        >
          {gapiIsInitialised ? 'Initialised!' : 'Initialise'}
        </button>
        <button
          type='button'
          className='focus:outline-none text-white bg-green-700 enabled:hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-green-600 enabled:dark:hover:bg-green-700 dark:focus:ring-green-900 disabled:bg-green-300'
          onClick={() => {
            const accessToken = oauthToken?.access_token
            if (accessToken) {
              sendSubscriptionsListRequest(accessToken, setSubscriptions)
            } else {
              console.error(
                'No access token found. Please sign in via OAuth to retrieve subscriptions',
              )
            }
          }}
          disabled={!gapiIsInitialised}
        >
          Get subscriptions
        </button>
        <input
          type='text'
          className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
          placeholder={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button
          type='button'
          className='focus:outline-none text-white bg-blue-700 enabled:hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 enabled:dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:bg-blue-300'
          onClick={() => sendQueryRequest(searchQuery, setSearchResults)}
          disabled={!gapiIsInitialised}
        >
          Send query
        </button>
      </div>
      <div className='flex flex-col justify-center items-center'>
        Subscriptions
        {subscriptions?.map(subscription => (
          <div key={subscription.id}>
            {subscription.snippet?.title} -{' '}
            {subscription.snippet?.resourceId?.channelId}
          </div>
        ))}
      </div>
      <div className='flex flex-col justify-center items-center border-t-2 mt-2'>
        Search results
        <SearchResultList fullResults={fullResults} />
      </div>
    </div>
  )
}
