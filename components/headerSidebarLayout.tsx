'use client'

import { useState } from 'react'
import Header from './header'
import Sidebar from './sidebar'

/**
 * Contains Header and Sidebar. Also fetches subscriptions and playlists of the user.
 */
export default function HeaderSidebarLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <>
      <Header toggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
      <Sidebar
        closeSidebar={() => setIsSidebarOpen(false)}
        isSidebarOpen={isSidebarOpen}
      />
    </>
  )
}
