import { Dispatch, SetStateAction } from 'react'

export type FullSearchResult = {
  searchResult?: gapi.client.youtube.SearchResult
  video?: gapi.client.youtube.Video
  channel?: gapi.client.youtube.Channel
}

export type SubscriptionApiResult = {
  result: gapi.client.youtube.Subscription
}

export type VideoListInfo = {
  videos: gapi.client.youtube.Video[]
  channels: Record<string, gapi.client.youtube.Channel>
}

export type EnvContextType = {
  GAPI_API_KEY: string
  GAPI_CLIENT_ID: string
  GAPI_CLIENT_SECRET: string
  gapiIsInitialised: boolean
  setGapiIsInitialised: Dispatch<SetStateAction<boolean>>
  oauthToken: OauthTokenState | null
  setOauthToken: Dispatch<SetStateAction<OauthTokenState | null>>
  gapiRequestCount: number
  setGapiRequestCount: Dispatch<SetStateAction<number>>
}

export type OauthTokenState = {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  refresh_token?: string
  expiry_date: Date
}
