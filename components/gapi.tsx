'use client'
import Script from 'next/script'
import { useContext } from 'react'
import { GapiContext } from '../app/gapiCtxt'

export default function GapiScript() {
  const { initGapiFromCtxt } = useContext(GapiContext)

  return (
    <Script src='https://apis.google.com/js/api.js' onLoad={initGapiFromCtxt} />
  )
}
