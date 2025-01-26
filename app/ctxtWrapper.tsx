import GapiCtxt from './gapiCtxt'
import UserCtxt from './userCtxt'

/**
 * Contains all contexts
 */
export default function CtxtWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const envVars = {
    GAPI_API_KEY: process.env.GAPI_API_KEY || '',
    GAPI_CLIENT_ID: process.env.GAPI_CLIENT_ID || '',
    GAPI_CLIENT_SECRET: process.env.GAPI_CLIENT_SECRET || '',
  }

  return (
    <GapiCtxt envVars={envVars}>
      <UserCtxt>{children}</UserCtxt>
    </GapiCtxt>
  )
}
