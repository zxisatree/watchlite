'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { FullSubscription, UserContextType } from './types'
import { GapiContext } from './gapiCtxt'
import { fetchSubscriptions, sendPlaylistListMineRequest } from './utils'

export const UserContext = createContext<UserContextType>({
  subscriptions: [],
  setSubscriptions: () => {},
  playlists: [],
  setPlaylists: () => {},
})

export default function UserCtxt({ children }: { children: React.ReactNode }) {
  const { gapiIsInitialised, oauthToken, isOauthTokenValid } =
    useContext(GapiContext)
  const [subscriptions, setSubscriptions] = useState<FullSubscription[]>([])
  const [playlists, setPlaylists] = useState<gapi.client.youtube.Playlist[]>([])

  // fetch subscriptions and playlists
  useEffect(() => {
    if (gapiIsInitialised && oauthToken && isOauthTokenValid) {
      sendPlaylistListMineRequest(setPlaylists)
      fetchSubscriptions(setSubscriptions)
    }
  }, [gapiIsInitialised, oauthToken])

  return (
    <UserContext.Provider
      value={{
        subscriptions,
        setSubscriptions,
        playlists,
        setPlaylists,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
