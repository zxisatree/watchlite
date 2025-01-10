'use client'

import { createContext, useState } from 'react'
import { EnvContextType } from './types'

type CtxtWrapperProps = {
  envVars: {
    GAPI_API_KEY: string
    GAPI_CLIENT_ID: string
    GAPI_CLIENT_SECRET: string
  }
  children: React.ReactNode
}

export const EnvContext = createContext<EnvContextType>({
  GAPI_API_KEY: '',
  GAPI_CLIENT_ID: '',
  GAPI_CLIENT_SECRET: '',
  gapiIsInitialised: false,
  setGapiIsInitialised: () => {},
})

export default function CtxtWrapper({
  envVars,
  children,
}: Readonly<CtxtWrapperProps>) {
  const [gapiIsInitialised, setGapiIsInitialised] = useState(false)
  return (
    <EnvContext.Provider
      value={{ ...envVars, gapiIsInitialised, setGapiIsInitialised }}
    >
      {children}
    </EnvContext.Provider>
  )
}
