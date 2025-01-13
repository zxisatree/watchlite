'use client'
import { useRouter } from 'next/navigation'
import Form from 'next/form'
import { EnvContext } from '../app/ctxt'
import { useContext } from 'react'
import { blueButton, refreshOauthToken, yellowButton } from '@/app/utils'
import { MdSearch } from 'react-icons/md'

export default function Header() {
  const router = useRouter()
  const {
    GAPI_CLIENT_ID,
    GAPI_CLIENT_SECRET,
    gapiIsInitialised,
    oauthToken,
    setOauthToken,
  } = useContext(EnvContext)

  function oauthRedirect() {
    const state = 'test_oauth'
    const client_id = GAPI_CLIENT_ID
    const callback_link = 'http://localhost:3000/oauth2callback'
    const link = `https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/youtube.readonly&response_type=code&access_type=offline&state=${state}&redirect_uri=${callback_link}&client_id=${client_id}`
    console.log(`client_id: ${client_id}`)
    router.push(link)
  }

  return (
    <div className='sticky inset-0 flex flex-row items-center space-x-2 p-8 bg-gray-500 bg-opacity-50 backdrop-blur-sm'>
      <button
        type='button'
        className={yellowButton}
        onClick={oauthRedirect}
        disabled={!gapiIsInitialised}
      >
        OAuth
      </button>
      <button
        type='button'
        className={blueButton}
        onClick={() =>
          refreshOauthToken(
            GAPI_CLIENT_ID,
            GAPI_CLIENT_SECRET,
            oauthToken!,
            setOauthToken,
          )
        }
        disabled={
          !oauthToken ||
          !oauthToken.refresh_token ||
          new Date() >= oauthToken.expiry_date
        }
      >
        Refresh OAuth token
      </button>
      <Form
        action='/results'
        className='flex flex-row items-center space-x-2 flex-grow'
      >
        <input
          type='text'
          name='search_query'
          className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 focus:placeholder-transparent'
          placeholder='Search...'
        />
        <button type='submit' className='h-6'>
          <MdSearch size={24} />
        </button>
      </Form>
    </div>
  )
}
