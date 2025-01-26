'use client'
import Script from 'next/script'
import { useContext } from 'react'
import { GapiContext } from '../app/gapiCtxt'
import { initGapi } from '../app/utils'

export default function GapiScript() {
  const { GAPI_API_KEY, GAPI_CLIENT_ID, setGapiIsInitialised } =
    useContext(GapiContext)

  return (
    <Script
      src='https://apis.google.com/js/api.js'
      onLoad={() => {
        initGapi(GAPI_API_KEY, GAPI_CLIENT_ID, setGapiIsInitialised)
      }}
    />
  )
}
