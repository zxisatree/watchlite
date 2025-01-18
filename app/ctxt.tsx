'use client'

import { createContext, useEffect, useState } from 'react'
import { EnvContextType, OauthTokenState } from './types'

type CtxtWrapperProps = {
  envVars: {
    GAPI_API_KEY: string
    GAPI_CLIENT_ID: string
    GAPI_CLIENT_SECRET: string
  }
  children: React.ReactNode
}

// prevent infinite loops, only send requests max 5 times per page load
export const EnvContext = createContext<EnvContextType>({
  GAPI_API_KEY: '',
  GAPI_CLIENT_ID: '',
  GAPI_CLIENT_SECRET: '',
  gapiIsInitialised: false,
  setGapiIsInitialised: () => {},
  subscriptions: [],
  setSubscriptions: () => {},
  oauthToken: null,
  setOauthToken: () => {},
  gapiRequestCount: 0,
  setGapiRequestCount: () => {},
})

/** Provides environment variables and global state. Also handles OAuth token parsing from localStorage */
export default function CtxtWrapper({
  envVars,
  children,
}: Readonly<CtxtWrapperProps>) {
  const [gapiIsInitialised, setGapiIsInitialised] = useState(false)
  const [subscriptions, setSubscriptions] = useState<
    gapi.client.youtube.Subscription[]
  >([])
  const [oauthToken, setOauthToken] = useState<OauthTokenState | null>(null)
  const [gapiRequestCount, setGapiRequestCount] = useState(0)

  useEffect(() => {
    const oauthError = localStorage.getItem('oauthError')
    const oauthTokenRaw = localStorage.getItem('oauthToken')
    if (oauthError !== null) {
      console.error(oauthError)
      localStorage.removeItem('oauthError')
    }
    if (oauthTokenRaw !== null) {
      const oauthTokenStateWithStringDate = JSON.parse(oauthTokenRaw)
      const oauthTokenState: OauthTokenState = {
        ...oauthTokenStateWithStringDate,
        expiry_date: new Date(oauthTokenStateWithStringDate.expiry_date),
      }
      // console.log('Acquired oauth token:')
      // console.log(oauthTokenState)
      // console.log('Expiry date:')
      // console.log(oauthTokenState.expiry_date)
      setOauthToken(oauthTokenState)
    }
  }, [])

  return (
    <EnvContext.Provider
      value={{
        ...envVars,
        gapiIsInitialised,
        setGapiIsInitialised,
        subscriptions,
        setSubscriptions,
        oauthToken,
        setOauthToken,
        gapiRequestCount,
        setGapiRequestCount,
      }}
    >
      {children}
    </EnvContext.Provider>
  )
}
