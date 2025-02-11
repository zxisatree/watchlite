/** WARNING: Only import this file in Server Components! googleapis requires modules only found in NextJS */
import { google } from 'googleapis'
import { FullSearchResult, PlaylistItemInfo } from '../app/types'
import { isDefined } from './utils'
export const yt = google.youtube({
  version: 'v3',
  auth: process.env.GAPI_API_KEY,
})

export function fetchSearchPlaylistItems(
  playlistIds: string[]
): Promise<Map<string, PlaylistItemInfo[]>> {
  // for each playlist, list playlist items, then get videos for each playlist item
  return Promise.all(
    playlistIds.map(playlistId => yt.playlistItems
      .list({
        part: ['snippet', 'contentDetails'],
        playlistId,
      })
      .then(async (playlistItemsResponse) => {
        const playlistItems = playlistItemsResponse.data.items
        const videosResponse = await yt.videos.list({
          part: ['contentDetails'],
          id: playlistItems
            ?.map(playlistItem => playlistItem.snippet?.resourceId?.videoId).filter(isDefined),
        })
        return {
          playlistItems: playlistItems || [],
          videos: videosResponse.data.items || [],
        }
      })
    )
  ).then(playlistData => {
    const info = new Map()
    for (let i = 0; i < playlistData.length; i++) {
      const playlistInfo = playlistData[i]
      if (playlistInfo.videos.length !== playlistInfo.playlistItems.length) {
        console.error(
          `playlistInfo.videos.length !== playlistInfo.playlistItems.length: ${playlistInfo.videos.length} !== ${playlistInfo.playlistItems.length}`
        )
        return info
      }

      info.set(
        playlistIds[i],
        (info.get(playlistIds[i]) || []).concat(
          playlistInfo.videos.map((video, index) => ({
            playlistItem: playlistInfo.playlistItems[index],
            video: video,
          }))
        )
      )
    }
    return info
  })
}

export function fetchSearchResults(query: string): Promise<FullSearchResult[]> {
  return yt.search
    .list({
      part: ['snippet'],
      q: query,
      maxResults: 25,
    })
    .then(async (response) => {
      const searchResults = response.data.items || []
      const videoResults = searchResults
        .map(searchResult => searchResult.id?.videoId)
        .filter(isDefined)
      const channelResults = searchResults
        .map(searchResult => searchResult.snippet?.channelId)
        .filter(isDefined)
      const playlistResults = searchResults
        .map(searchResult => searchResult.id?.playlistId)
        .filter(isDefined)

      const videoRequest = yt.videos
        .list({
          part: ['snippet', 'statistics'],
          id: videoResults,
        })
        .then(response => {
          return response.data.items || []
        })

      const channelRequest = yt.channels
        .list({
          part: ['snippet'],
          id: channelResults,
        })
        .then(response => {
          return response.data.items || []
        })

      const playlistRequest = fetchSearchPlaylistItems(playlistResults)

      return {
        searchResults,
        videos: await videoRequest,
        channels: await channelRequest,
        playlists: await playlistRequest,
      }
    })
    .then(({ searchResults, videos, channels, playlists }) => {
      const videoIdToResult = new Map()
      for (const videoResult of videos) {
        videoIdToResult.set(videoResult.id, videoResult)
      }

      const channelIdToResult = new Map()
      for (const channelResult of channels) {
        channelIdToResult.set(channelResult.id, channelResult)
      }

      const playlistIdToResult = new Map()
      for (const [playlistId, playlistResult] of playlists) {
        playlistIdToResult.set(playlistId, playlistResult)
      }

      return searchResults
        .map(searchResult => {
          const searchResultVideoId = searchResult.id?.videoId
          const searchResultChannelId = searchResult.snippet?.channelId
          const searchResultPlaylistId = searchResult.id?.playlistId
          const hasVideo = videoIdToResult.has(searchResultVideoId)
          const hasChannel = channelIdToResult.has(searchResultChannelId)
          const hasPlaylist = playlistIdToResult.has(searchResultPlaylistId)

          if (hasVideo && hasChannel) {
            return {
              video: videoIdToResult.get(searchResultVideoId),
              channel: channelIdToResult.get(searchResultChannelId),
            }
          } else if (hasChannel && !hasPlaylist) {
            return {
              channel: channelIdToResult.get(searchResultChannelId),
            }
          } else if (hasPlaylist) {
            return {
              searchResult,
              channel: channelIdToResult.get(searchResultChannelId),
              playlistItemInfos: playlistIdToResult.get(searchResultPlaylistId),
            }
          } else {
            console.error('invalid search result')
            return null
          }
        })
        .filter(isDefined)
    })
}