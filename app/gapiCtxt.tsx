'use client'

import { createContext, useEffect, useState } from 'react'
import { GapiContextType, OauthTokenState } from './types'
import { initGapi } from './utils'
import { gapiRequestLimit } from './constants'

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
  initGapiFromCtxt: () => {},
  oauthToken: null,
  setOauthToken: () => {},
  isOauthTokenLoading: true,
  setIsOauthTokenLoading: () => {},
  isOauthTokenValid: false,
  incGapiRequestCount: () => false,
})

/** Provides environment variables and global state. Also handles OAuth token parsing from localStorage */
export default function GapiCtxt({
  envVars,
  children,
}: Readonly<GapiCtxtWrapperProps>) {
  // Set on <Gapi> Script's onLoad
  const [gapiIsInitialised, setGapiIsInitialised] = useState(false)
  const [gapiRequestCount, setGapiRequestCount] = useState(0)
  const [oauthToken, setOauthToken] = useState<OauthTokenState | null>(null)
  const [isOauthTokenLoading, setIsOauthTokenLoading] = useState(true)
  const isOauthTokenValid = !(
    isOauthTokenLoading ||
    !oauthToken ||
    !oauthToken.expiry_date ||
    new Date() >= oauthToken.expiry_date
  )

  function initGapiFromCtxt() {
    initGapi(envVars.GAPI_API_KEY, envVars.GAPI_CLIENT_ID, setGapiIsInitialised)
  }

  /** Returns false if too many requests have been sent */
  function incGapiRequestCount() {
    if (gapiRequestCount > gapiRequestLimit) {
      return false
    }
    setGapiRequestCount(gapiRequestCount + 1)
    return true
  }

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
        setIsOauthTokenLoading(false)
      }
    }
  }, [gapiIsInitialised])

  return (
    <GapiContext.Provider
      value={{
        ...envVars,
        gapiIsInitialised,
        initGapiFromCtxt,
        oauthToken,
        setOauthToken,
        isOauthTokenLoading,
        setIsOauthTokenLoading,
        isOauthTokenValid,
        incGapiRequestCount,
      }}
    >
      {children}
    </GapiContext.Provider>
  )
}
