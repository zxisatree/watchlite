'use client'
import { useRouter } from 'next/navigation'
import Form from 'next/form'
import { GapiContext } from '../app/gapiCtxt'
import { useContext } from 'react'
import { refreshOauthToken } from '@/app/utils'
import { blueButton, yellowButton } from '@/app/tailwindStyles'
import { MdMenu, MdSearch } from 'react-icons/md'
import { randomBytes } from 'crypto'
import { baseUrl, csrfStateKey } from '@/app/constants'
import Link from 'next/link'
import { IconContext } from 'react-icons'
import { IoMdCheckmarkCircle, IoMdCloseCircle } from 'react-icons/io'

export default function Header({
  toggleSidebar,
}: {
  toggleSidebar: () => void
}) {
  const router = useRouter()
  const {
    GAPI_CLIENT_ID,
    GAPI_CLIENT_SECRET,
    gapiIsInitialised,
    oauthToken,
    setOauthToken,
    isOauthTokenValid,
  } = useContext(GapiContext)
  // console.log('Header expiry date check:')
  // console.log(new Date() >= oauthToken!.expiry_date)
  const shouldRefreshBeDisabled =
    !oauthToken ||
    !oauthToken.refresh_token ||
    new Date() < oauthToken.expiry_date

  function oauthRedirect() {
    const state = randomBytes(16).toString('hex')
    localStorage.setItem(csrfStateKey, state)
    const client_id = GAPI_CLIENT_ID
    const callback_link = `${baseUrl}/oauth2callback`
    const link = new URL('https://accounts.google.com/o/oauth2/auth')
    const params = new URLSearchParams({
      state: state,
      client_id: client_id,
      redirect_uri: callback_link,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
    })
    link.search = params.toString()
    router.push(link.toString())
  }

  return (
    <div className='sticky inset-0 flex flex-row items-center space-x-2 p-8 z-40 bg-gray-500 bg-opacity-50 backdrop-blur-sm'>
      <button onClick={toggleSidebar}>
        <MdMenu size={24} />
      </button>
      <Link href='/' className='font-bold'>
        WatchLite
      </Link>
      {isOauthTokenValid ? (
        <IconContext.Provider value={{ className: 'text-green-300' }}>
          <IoMdCheckmarkCircle size={24} title='OAuth token is valid!' />
        </IconContext.Provider>
      ) : (
        <IconContext.Provider value={{ className: 'text-red-300' }}>
          <IoMdCloseCircle size={24} title='Invalid OAuth token.' />
        </IconContext.Provider>
      )}
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
        disabled={shouldRefreshBeDisabled}
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
