import { Dispatch, SetStateAction } from 'react'

export type FullSearchResult =
  | VideoSearchResult
  | ChannelSearchResult
  | PlaylistSearchResult

export type VideoSearchResult = {
  video: gapi.client.youtube.Video
  channel: gapi.client.youtube.Channel
}

export type ChannelSearchResult = {
  channel: gapi.client.youtube.Channel
}

export type PlaylistSearchResult = {
  searchResult: gapi.client.youtube.SearchResult
  channel: gapi.client.youtube.Channel
  playlistItemInfos: PlaylistItemInfo[]
}

export type PlaylistItemInfo = {
  playlistItem: gapi.client.youtube.PlaylistItem
  video: gapi.client.youtube.Video
}

export type SubscriptionApiResult = {
  result: gapi.client.youtube.Subscription
}

/** Describes a playlist on home page and watch page, where videos need the creator's channel information */
export type VideoListInfo = {
  videos: gapi.client.youtube.Video[]
  channels: Record<string, gapi.client.youtube.Channel>
}

export type GapiContextType = {
  GAPI_API_KEY: string
  GAPI_CLIENT_ID: string
  GAPI_CLIENT_SECRET: string
  gapiIsInitialised: boolean
  initGapiFromCtxt: () => void
  oauthToken: OauthTokenState | null
  setOauthToken: Dispatch<SetStateAction<OauthTokenState | null>>
  isOauthTokenLoading: boolean
  setIsOauthTokenLoading: Dispatch<SetStateAction<boolean>>
  isOauthTokenValid: boolean
  incGapiRequestCount: () => boolean
}

export type FullSubscription = {
  subscription: gapi.client.youtube.Subscription
  channel: gapi.client.youtube.Channel
}

export type UserContextType = {
  subscriptions: FullSubscription[]
  setSubscriptions: Dispatch<SetStateAction<FullSubscription[]>>
  playlists: gapi.client.youtube.Playlist[]
  setPlaylists: Dispatch<SetStateAction<gapi.client.youtube.Playlist[]>>
}

export type OauthTokenState = {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  refresh_token?: string
  expiry_date: Date
}
