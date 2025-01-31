'use client'

import {
  colouredActiveSidebarPlaylistButtons,
  colouredSidebarPlaylistButtons,
} from '@/app/tailwindStyles'
import { UserContext } from '@/app/userCtxt'
import { mod, murmurHash } from '@/app/utils'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useContext } from 'react'
import { MdMenu } from 'react-icons/md'

function SidebarLayoutWrapper({
  isSidebarOpen,
  children,
}: {
  isSidebarOpen: boolean
  children: React.ReactNode
}) {
  if (!isSidebarOpen) {
    return (
      <div className='fixed top-0 left-0 z-50 h-screen w-64 overflow-y-auto transition-transform -translate-x-full'>
        {children}
      </div>
    )
  } else {
    return (
      <div className='fixed top-0 left-0 z-50 h-screen w-64 overflow-y-auto transition-transform'>
        {children}
      </div>
    )
  }
}

export default function Sidebar({
  isSidebarOpen,
  closeSidebar,
}: {
  isSidebarOpen: boolean
  closeSidebar: () => void
}) {
  const { subscriptions, playlists } = useContext(UserContext)
  const searchParams = useSearchParams()
  const chosenPlaylistId = searchParams.get('playlistId')

  return (
    <>
      {/* Blurred backdrop */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity'
          onClick={closeSidebar}
        />
      )}
      <SidebarLayoutWrapper isSidebarOpen={isSidebarOpen}>
        <div className='relative h-screen w-64 z-50 overflow-y-auto bg-gray-400'>
          <div className='flex space-x-2 pt-10 pl-10 pb-5'>
            <button onClick={closeSidebar}>
              <MdMenu size={24} />
            </button>
            <Link href='/' className='font-bold'>
              WatchLite
            </Link>
          </div>
          <div className='flex flex-col pt-4 px-4 border-t border-gray-500 space-y-1 font-semibold'>
            Playlists
            {playlists.map(playlist => {
              const tileIdx = mod(
                murmurHash(playlist.id || ''),
                colouredSidebarPlaylistButtons.length,
              )
              const isActivePlaylist = chosenPlaylistId === playlist.id
              return (
                <Link
                  href={`/?playlistId=${playlist.id}`}
                  onClick={closeSidebar}
                  key={playlist.id}
                  className='h-8'
                >
                  <div
                    className={
                      isActivePlaylist
                        ? colouredActiveSidebarPlaylistButtons[tileIdx]
                        : colouredSidebarPlaylistButtons[tileIdx]
                    }
                  >
                    <div className='p-1 pl-2'>{playlist.snippet?.title}</div>
                  </div>
                </Link>
              )
            })}
          </div>
          <div className='flex flex-col mt-4 pt-2 px-4 border-t border-gray-500 space-y-1 font-semibold'>
            Subscriptions
            {subscriptions.map(fullSubscription => {
              return (
                <Link
                  key={fullSubscription.subscription.id}
                  href={`/${fullSubscription.channel.snippet?.customUrl}`}
                  className='h-8 rounded-lg p-1 pl-2 bg-gray-300 hover:bg-gray-500 transition-colors'
                  onClick={closeSidebar}
                >
                  {fullSubscription.subscription.snippet?.title}
                </Link>
              )
            })}
          </div>
        </div>
      </SidebarLayoutWrapper>
    </>
  )
}
