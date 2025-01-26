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

export default function Sidebar({
  isSidebarOpen,
  closeSidebar,
}: {
  isSidebarOpen: boolean
  closeSidebar: () => void
}) {
  const { playlists } = useContext(UserContext)
  const searchParams = useSearchParams()
  const chosenPlaylistId = searchParams.get('playlistId')

  if (!isSidebarOpen) {
    return (
      <div className='fixed top-0 left-0 z-50 h-screen w-screen overflow-y-auto transition-transform -translate-x-full'></div>
    )
  } else {
    // TODO: make backdrop appear instead of sliding in, and make sidebar fade out
    return (
      <div className='fixed top-0 left-0 z-50 h-screen w-screen overflow-y-auto transition-transform'>
        {/* Blurred backdrop */}
        <div
          className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40'
          onClick={closeSidebar}
        ></div>
        <div className='relative h-screen w-64 z-50 overflow-y-auto bg-gray-400'>
          <div className='flex space-x-2 pt-10 pl-10 pb-5'>
            <button onClick={closeSidebar}>
              <MdMenu size={24} />
            </button>
            <Link href='/' className='font-bold'>
              WatchLite
            </Link>
          </div>
          <div className='flex flex-col pt-4 px-4 border-t border-gray-500 space-y-1'>
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
                    {playlist.snippet?.title}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}
