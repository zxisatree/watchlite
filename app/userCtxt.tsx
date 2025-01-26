'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { UserContextType } from './types'
import { GapiContext } from './gapiCtxt'
import { fetchSubscribedChannels, sendPlaylistListRequest } from './utils'

export const UserContext = createContext<UserContextType>({
  subscriptions: [],
  setSubscriptions: () => {},
  subscribedChannels: [],
  setSubscribedChannels: () => {},
  playlists: [],
  setPlaylists: () => {},
})

export default function UserCtxt({ children }: { children: React.ReactNode }) {
  const { gapiIsInitialised, oauthToken } = useContext(GapiContext)
  const [subscriptions, setSubscriptions] = useState<
    gapi.client.youtube.Subscription[]
  >([])
  const [subscribedChannels, setSubscribedChannels] = useState<
    gapi.client.youtube.Channel[]
  >([])
  const [playlists, setPlaylists] = useState<gapi.client.youtube.Playlist[]>([])

  // fetch subscriptions and playlists
  useEffect(() => {
    if (
      gapiIsInitialised &&
      oauthToken &&
      new Date() < oauthToken.expiry_date
    ) {
      sendPlaylistListRequest(setPlaylists)
      fetchSubscribedChannels(setSubscribedChannels)
    }
  }, [gapiIsInitialised, oauthToken])

  return (
    <UserContext.Provider
      value={{
        subscriptions,
        setSubscriptions,
        subscribedChannels,
        setSubscribedChannels,
        playlists,
        setPlaylists,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
