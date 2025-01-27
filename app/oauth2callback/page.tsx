'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useContext, useEffect } from 'react'
import { GapiContext } from '../gapiCtxt'
import { OauthTokenState } from '../types'
import { csrfStateKey } from '../constants'

export default function OauthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { GAPI_CLIENT_ID, GAPI_CLIENT_SECRET, setOauthToken } =
    useContext(GapiContext)

  const params = {
    code: searchParams.get('code') || '',
    client_id: GAPI_CLIENT_ID,
    client_secret: GAPI_CLIENT_SECRET,
    redirect_uri: 'http://localhost:3000/oauth2callback',
    grant_type: 'authorization_code',
    scope: '',
    // access_type: 'offline',
    // prompt: 'consent',
    // approval_prompt: 'force',
  }

  // Ensure fetch only runs once
  useEffect(() => {
    // check if CSRF state is valid
    const state = searchParams.get('state')
    if (state && state !== localStorage.getItem(csrfStateKey)) {
      console.error('State mismatched, returning to main page')
      router.push('/')
    } else {
      fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      })
        .then(response => response.json())
        .then(data => {
          const expiryInSeconds = new Date().getTime() + data.expires_in * 1000
          const oauthToken: OauthTokenState = {
            ...data,
            expiry_date: new Date(expiryInSeconds),
          }
          localStorage.setItem('oauthToken', JSON.stringify(oauthToken))
          setOauthToken(oauthToken)
        })
        .catch(err => {
          localStorage.setItem('oauthError', err)
        })
        .finally(() => {
          router.push('/')
        })
    }
  }, [])

  return (
    <div>
      hello, welcome to oauth land. if you are have been seeing this message for
      some time, something has gone wrong. refresh the page or re authenticate
      yourself.
    </div>
  )
}
