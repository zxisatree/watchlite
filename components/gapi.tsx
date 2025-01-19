'use client'
import Script from 'next/script'
import { useContext } from 'react'
import { EnvContext } from '../app/ctxt'
import { initGapi } from '../app/utils'

export default function GapiScript() {
  const { GAPI_API_KEY, GAPI_CLIENT_ID, setGapiIsInitialised } =
    useContext(EnvContext)

  return (
    <Script
      src='https://apis.google.com/js/api.js'
      onLoad={() => {
        initGapi(GAPI_API_KEY, GAPI_CLIENT_ID, setGapiIsInitialised)
      }}
    />
  )
}
