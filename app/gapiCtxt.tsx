'use client'

import { createContext, useEffect, useState } from 'react'
import { GapiContextType, OauthTokenState } from './types'

type GapiCtxtWrapperProps = {
  envVars: {
    GAPI_API_KEY: string
    GAPI_CLIENT_ID: string
    GAPI_CLIENT_SECRET: string
  }
  children: React.ReactNode
}

// to prevent infinite loops, only send requests max 5 times per page load
export const GapiContext = createContext<GapiContextType>({
  GAPI_API_KEY: '',
  GAPI_CLIENT_ID: '',
  GAPI_CLIENT_SECRET: '',
  gapiIsInitialised: false,
  setGapiIsInitialised: () => {},
  oauthToken: null,
  setOauthToken: () => {},
  isOauthTokenValid: false,
  gapiRequestCount: 0,
  setGapiRequestCount: () => {},
})

/** Provides environment variables and global state. Also handles OAuth token parsing from localStorage */
export default function GapiCtxt({
  envVars,
  children,
}: Readonly<GapiCtxtWrapperProps>) {
  // Set on <Gapi> Script's onLoad
  const [gapiIsInitialised, setGapiIsInitialised] = useState(false)
  const [oauthToken, setOauthToken] = useState<OauthTokenState | null>(null)
  const [gapiRequestCount, setGapiRequestCount] = useState(0)
  const isOauthTokenValid = !(
    !oauthToken ||
    !oauthToken.expiry_date ||
    new Date() >= oauthToken.expiry_date
  )

  useEffect(() => {
    if (gapiIsInitialised) {
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
        gapi.client.setToken({ access_token: oauthTokenState.access_token })
        setOauthToken(oauthTokenState)
      }
    }
  }, [gapiIsInitialised])

  return (
    <GapiContext.Provider
      value={{
        ...envVars,
        gapiIsInitialised,
        setGapiIsInitialised,
        oauthToken,
        setOauthToken,
        isOauthTokenValid,
        gapiRequestCount,
        // TODO: replace with increment function that returns bool
        setGapiRequestCount,
      }}
    >
      {children}
    </GapiContext.Provider>
  )
}
