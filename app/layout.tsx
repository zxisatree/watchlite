import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import GapiScript from '../components/gapi'
import HeaderSidebarLayout from '@/components/headerSidebarLayout'
import CtxtWrapper from './ctxtWrapper'

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
  return (
    <html lang='en' className='h-full'>
      <head>
        <script src='https://unpkg.com/react-scan/dist/auto.global.js' async />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CtxtWrapper>
          <GapiScript />
          <HeaderSidebarLayout />
          {children}
        </CtxtWrapper>
      </body>
    </html>
  )
}
