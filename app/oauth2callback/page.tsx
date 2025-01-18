'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useContext, useEffect } from 'react'
import { EnvContext } from '../ctxt'
import Link from 'next/link'
import { OauthTokenState } from '../types'

export default function OauthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { GAPI_CLIENT_ID, GAPI_CLIENT_SECRET, setOauthToken } =
    useContext(EnvContext)

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

  useEffect(() => {
    // check if return is valid
    const state = searchParams.get('state')
    if (state && state !== localStorage.getItem('csrfState')) {
      console.error('State mismatched, returning to main page')
      router.push('/')
      return
    }

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
        // console.log('Received token:')
        // console.log(oauthToken)
        // console.log('New date:')
        // console.log(new Date())
        // console.log('expiry_date:')
        // console.log(oauthToken.expiry_date)
        localStorage.setItem('oauthToken', JSON.stringify(oauthToken))
        setOauthToken(oauthToken)
        router.push('/')
      })
      .catch(err => {
        localStorage.setItem('oauthError', err)
        router.push('/')
      })
  }, [])

  return (
    <div>
      hello, welcome to oauth land.
      <br />
      <Link href='/'>Back to home page</Link>
    </div>
  )
}
