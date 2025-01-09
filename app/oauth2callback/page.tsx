'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useContext, useEffect } from 'react'
import { EnvContext } from '../ctxt'
import Link from 'next/link'

export default function OauthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const envContext = useContext(EnvContext)

  // check if return is valid
  // const state = searchParams.get("state")
  // const scope = searchParams.get("scope")
  const code = searchParams.get('code') || ''

  const params = {
    code: code,
    client_id: envContext.GAPI_CLIENT_ID,
    client_secret: envContext.GAPI_CLIENT_SECRET,
    redirect_uri: 'http://localhost:3000/oauth2callback',
    grant_type: 'authorization_code',
    scope: '',
  }
  console.log('params:')
  console.log(params)

  useEffect(() => {
    fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    })
      .then(response => response.json())
      .then(data => {
        localStorage.setItem('oauthToken', JSON.stringify(data))
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
