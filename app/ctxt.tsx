'use client'

import { createContext } from 'react'

type EnvContextType = {
  YOUTUBE_API_KEY: string
  GAPI_CLIENT_ID: string
  GAPI_CLIENT_SECRET: string
}

type CtxtWrapperProps = {
  envVars: EnvContextType
  children: React.ReactNode
}

export const EnvContext = createContext<EnvContextType>({
  YOUTUBE_API_KEY: '',
  GAPI_CLIENT_ID: '',
  GAPI_CLIENT_SECRET: '',
})

export default function CtxtWrapper({
  envVars,
  children,
}: Readonly<CtxtWrapperProps>) {
  return <EnvContext.Provider value={envVars}>{children}</EnvContext.Provider>
}
