'use client'

import { useState } from 'react'
import { initGapi, sendQueryRequest } from './query'
import SearchResult from './searchResult'

type SearchProps = {
  apiKey: string
}

export default function Search({ apiKey }: SearchProps) {
  function sendQuery() {
    console.log('sending query...')
    sendQueryRequest(searchQuery, setResults)
  }
  function init() {
    console.log('initialising...')
    initGapi(apiKey, setIsInitialised)
  }

  // Will return empty string if result.is is null
  function keyResultById(result: gapi.client.youtube.SearchResult): string {
    return [result.id?.channelId, result.id?.playlistId, result.id?.videoId]
      .filter(Boolean)
      .join()
  }

  const [searchQuery, setSearchQuery] = useState('types of coffee')
  const [results, setResults] = useState<gapi.client.youtube.SearchResult[]>([])
  const [isInitialised, setIsInitialised] = useState(false)

  return (
    <>
      <div className='flex flex-row'>
        <button
          type='button'
          className='focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 disabled:bg-red-300'
          onClick={init}
          disabled={isInitialised}
        >
          {isInitialised ? 'Initialised!' : 'Initialise'}
        </button>
        <button
          type='button'
          className='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'
          onClick={sendQuery}
          disabled={!isInitialised}
        >
          Send query
        </button>
      </div>
      <div>
        <label
          htmlFor='first_name'
          className='block text-sm font-medium text-gray-900 dark:text-white'
        >
          Query
        </label>
        <input
          type='text'
          id='first_name'
          className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
          placeholder={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      {results.map(result => (
        <SearchResult key={keyResultById(result)} result={result} />
      ))}
    </>
  )
}
