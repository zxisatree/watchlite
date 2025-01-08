import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Script from 'next/script'
import CtxtWrapper from './ctxt'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'WatchLite',
  description: 'Youtube wrapper',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const envVars = {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
    GAPI_CLIENT_ID: process.env.GAPI_CLIENT_ID || '',
    GAPI_CLIENT_SECRET: process.env.GAPI_CLIENT_SECRET || '',
  }
  return (
    <html lang='en' className='h-full'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <Script
          src='https://apis.google.com/js/api.js'
          strategy='beforeInteractive'
        />
        <CtxtWrapper envVars={envVars}>{children}</CtxtWrapper>
      </body>
    </html>
  )
}
