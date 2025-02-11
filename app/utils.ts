import { Dispatch, SetStateAction } from 'react'
import {
  ChannelSearchResult,
  FullSearchResult,
  FullSubscription,
  OauthTokenState,
  PlaylistSearchResult,
  VideoListInfo,
  VideoSearchResult,
} from './types'
import { GaxiosPromise, GaxiosResponse } from 'gaxios'
import { youtube_v3 } from 'googleapis'

export function initGapi(
  apiKey: string,
  clientId: string,
  setIsInitialised: Dispatch<SetStateAction<boolean>>,
) {
  if (apiKey === '') {
    console.error('API key is empty.')
    return
  }
  gapi.load('client', async function () {
    await gapi.client.init({
      apiKey: apiKey,
      // clientId: clientId,
      // scope: 'https://www.googleapis.com/auth/youtube',
      discoveryDocs: [
        'https://youtube.googleapis.com/$discovery/rest?version=v3',
      ],
    })
    setIsInitialised(true)
  })
}

/** oauthToken.refresh_token must exist */
export function refreshOauthToken(
  client_id: string,
  client_secret: string,
  oauthToken: OauthTokenState,
  setOauthToken: Dispatch<SetStateAction<OauthTokenState | null>>,
) {
  const params = {
    refresh_token: oauthToken.refresh_token!,
    client_id,
    client_secret,
    grant_type: 'refresh_token',
  }

  fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  })
    .then(response => response.json())
    .then(data => {
      console.log('Refreshing token')
      console.log(data)
      const expiryInSeconds = new Date().getTime() + data.expires_in * 1000
      const refreshedOauthToken: OauthTokenState = {
        ...data,
        refresh_token: oauthToken.refresh_token!,
        expiry_date: new Date(expiryInSeconds),
      }
      localStorage.setItem('oauthToken', JSON.stringify(refreshedOauthToken))
      setOauthToken(refreshedOauthToken)
    })
    .catch(err => {
      localStorage.setItem('oauthError', err)
    })
}

export function isVideoSearchResult(
  result: FullSearchResult,
): result is VideoSearchResult {
  return 'video' in result
}

export function isChannelSearchResult(
  result: FullSearchResult,
): result is ChannelSearchResult {
  return 'channel' in result && !('playlistItemInfos' in result)
}

export function isPlaylistSearchResult(
  result: FullSearchResult,
): result is PlaylistSearchResult {
  return 'playlistItemInfos' in result
}

// Will return empty string if result.is is null
export function keySearchResultById(result: FullSearchResult): string {
  if (isVideoSearchResult(result)) {
    return result.video.id!
  } else if (isPlaylistSearchResult(result)) {
    return result.searchResult.id!.playlistId!
  } else if (isChannelSearchResult(result)) {
    return result.channel.id!
  }

  // Should never reach here
  return ''
}

const thumbnailResolutions: (keyof gapi.client.youtube.ThumbnailDetails)[] = [
  'maxres',
  'high',
  'medium',
  'default',
  'standard',
]
export function chooseThumbnail(
  thumbnailDetails: gapi.client.youtube.ThumbnailDetails,
  preferred: keyof gapi.client.youtube.ThumbnailDetails = 'default',
): gapi.client.youtube.Thumbnail {
  // map each resolution to a thumbnail
  const thumbnails = new Map(
    thumbnailResolutions.map(resolution => [
      resolution,
      thumbnailDetails[resolution],
    ]),
  )
  const preferredThumbnail = thumbnails.get(preferred)
  if (preferredThumbnail) {
    return preferredThumbnail
  }

  for (const resolution of thumbnailResolutions) {
    const thumbnail = thumbnails.get(resolution)
    if (thumbnail) {
      return thumbnail
    }
  }

  // return default thumbnail
  return {
    url: '/default_thumbnail.png',
    width: 120,
    height: 90,
  }
}

type PaginatedResponse<T> = { items?: T[]; nextPageToken?: string }
/**
 * Recursively flattens responses from gapi requests that paginate results.
 *
 * @param response Parameter of .then callback
 * @param gapiRequestFn gapi function to send request. e.g. gapi.client.youtube.playlists.list
 * @param baseParams Parameters to send to gapiRequestFn
 * @param acc Accumulator array for results
 * @param maxResults Maximum number of results to retrieve
 * @returns Array of results
 */
export function handleNextPageResponses<T>(
  response: gapi.client.Response<PaginatedResponse<T>>,
  gapiRequestFn: (
    params: typeof baseParams,
  ) => gapi.client.Request<PaginatedResponse<T>>,
  baseParams: {
    part: string
  },
  maxResults?: number,
  acc: T[] = [],
): Promise<T[]> | T[] {
  const responseResult = response.result
  const responseItems = responseResult.items

  if (!responseItems || (maxResults && acc.length >= maxResults)) {
    return acc
  }

  const nextPageToken = responseResult.nextPageToken
  if (nextPageToken) {
    const nextPageParams = {
      ...baseParams,
      pageToken: nextPageToken,
    }
    return gapiRequestFn(nextPageParams).then(response =>
      handleNextPageResponses(
        response,
        gapiRequestFn,
        baseParams,
        maxResults,
        acc.concat(responseItems),
      ),
    )
  } else {
    return acc.concat(responseItems)
  }
}

type PaginatedResponseNode<T> = { items?: T[]; nextPageToken?: string | null }
/**
 * Recursively flattens responses from gapi requests that paginate results.
 * For googleapis node.js client
 *
 * @param response Parameter of .then callback
 * @param gapiRequestFn googleapis function to send request. e.g. yt.playlists.list. Must be bound to the parent object e.g. yt.playlists
 * @param baseParams Parameters to send to gapiRequestFn
 * @param acc Accumulator array for results
 * @param maxResults Maximum number of results to retrieve
 * @returns Array of results
 */
export function handleNextPageResponsesNode<T>(
  response: GaxiosResponse<PaginatedResponseNode<T>>,
  gapiRequestFn: (
    params: typeof baseParams,
  ) => GaxiosPromise<PaginatedResponseNode<T>>,
  baseParams: {
    part: string[]
  },
  maxResults?: number,
  acc: T[] = [],
): Promise<T[]> | T[] {
  const responseResult = response.data
  const responseItems = responseResult.items

  if (!responseItems || (maxResults && acc.length >= maxResults)) {
    return acc
  }

  const nextPageToken = responseResult.nextPageToken
  if (nextPageToken) {
    const nextPageParams = {
      ...baseParams,
      pageToken: nextPageToken,
    }
    return gapiRequestFn(nextPageParams).then(response =>
      handleNextPageResponsesNode(
        response,
        gapiRequestFn,
        baseParams,
        maxResults,
        acc.concat(responseItems),
      ),
    )
  } else {
    return acc.concat(responseItems)
  }
}

export function handlePlaylistItemsResponse(
  response: gapi.client.Response<gapi.client.youtube.PlaylistItemListResponse>,
  baseParams: {
    part: string
    playlistId: string | undefined
  },
  acc: gapi.client.youtube.PlaylistItem[],
):
  | Promise<gapi.client.youtube.PlaylistItem[]>
  | gapi.client.youtube.PlaylistItem[] {
  const responseResult = response.result
  const responseItems = responseResult.items
  if (!responseItems) {
    return acc
  }

  // send requests for all playlist items
  const nextPageToken = responseResult.nextPageToken
  if (nextPageToken) {
    const nextPageParams = {
      ...baseParams,
      pageToken: nextPageToken,
    }
    return gapi.client.youtube.playlistItems
      .list(nextPageParams)
      .then(response =>
        handlePlaylistItemsResponse(
          response,
          baseParams,
          acc.concat(responseItems),
        ),
      )
  } else {
    return acc.concat(responseItems)
  }
}

/**
 * The following functions are for using components that require gapi types with Server Components, that uses googleapis.
 * googleapis have similar types to gapi, but many types are labelled as `T | undefined | null` instead of `T | undefined`.
 * We can also use the utility type `NonNullable<T>` to convert `T | undefined | null` to `T | undefined`.
 */

export function videoAdapter(
  video?: youtube_v3.Schema$Video,
): gapi.client.youtube.Video {
  return {
    id: video?.id || undefined,
    snippet: videoSnippetAdapter(video?.snippet) || undefined,
    contentDetails:
      videoContentDetailsAdapter(video?.contentDetails) || undefined,
    statistics: videoStatisticsAdapter(video?.statistics) || undefined,
  }
}

export function videoSnippetAdapter(
  snippet?: youtube_v3.Schema$VideoSnippet,
): gapi.client.youtube.VideoSnippet {
  return {
    channelId: snippet?.channelId || undefined,
    channelTitle: snippet?.channelTitle || undefined,
    description: snippet?.description || undefined,
    liveBroadcastContent: snippet?.liveBroadcastContent || undefined,
    publishedAt: snippet?.publishedAt || undefined,
    thumbnails: thumbnailDetailsAdapter(snippet?.thumbnails),
    title: snippet?.title || undefined,
  }
}

export function videoContentDetailsAdapter(
  contentDetails?: youtube_v3.Schema$VideoContentDetails,
): gapi.client.youtube.VideoContentDetails {
  return {
    caption: contentDetails?.caption || undefined,
    definition: contentDetails?.definition || undefined,
    dimension: contentDetails?.dimension || undefined,
    duration: contentDetails?.duration || undefined,
    licensedContent: contentDetails?.licensedContent || undefined,
    projection: contentDetails?.projection || undefined,
    regionRestriction:
      videoContentDetailsRegionRestrictionAdapter(
        contentDetails?.regionRestriction,
      ) || undefined,
  }
}

export function videoContentDetailsRegionRestrictionAdapter(
  regionRestriction?: youtube_v3.Schema$VideoContentDetailsRegionRestriction,
): gapi.client.youtube.VideoContentDetailsRegionRestriction {
  return {
    allowed: regionRestriction?.allowed || undefined,
    blocked: regionRestriction?.blocked || undefined,
  }
}

export function videoStatisticsAdapter(
  statistics?: youtube_v3.Schema$VideoStatistics,
): gapi.client.youtube.VideoStatistics {
  return {
    commentCount: statistics?.commentCount || undefined,
    dislikeCount: statistics?.dislikeCount || undefined,
    favoriteCount: statistics?.favoriteCount || undefined,
    likeCount: statistics?.likeCount || undefined,
    viewCount: statistics?.viewCount || undefined,
  }
}

export function channelAdapter(
  channel?: youtube_v3.Schema$Channel,
): gapi.client.youtube.Channel {
  return {
    id: channel?.id || undefined,
    snippet: channelSnippetAdapter(channel?.snippet) || undefined,
    contentDetails:
      channelContentDetailsAdapter(channel?.contentDetails) || undefined,
    statistics: channelStatisticsAdapter(channel?.statistics) || undefined,
  }
}

export function channelSnippetAdapter(
  snippet?: youtube_v3.Schema$ChannelSnippet,
): gapi.client.youtube.ChannelSnippet {
  return {
    country: snippet?.country || undefined,
    customUrl: snippet?.customUrl || undefined,
    description: snippet?.description || undefined,
    localized: channelSnippetLocalizedAdapter(snippet?.localized) || undefined,
    publishedAt: snippet?.publishedAt || undefined,
    thumbnails: thumbnailDetailsAdapter(snippet?.thumbnails),
    title: snippet?.title || undefined,
  }
}

export function channelSnippetLocalizedAdapter(
  localized?: youtube_v3.Schema$ChannelLocalization,
): gapi.client.youtube.ChannelLocalization {
  return {
    description: localized?.description || undefined,
    title: localized?.title || undefined,
  }
}

export function channelContentDetailsAdapter(
  contentDetails?: youtube_v3.Schema$ChannelContentDetails,
): gapi.client.youtube.ChannelContentDetails {
  return {
    relatedPlaylists: contentDetails?.relatedPlaylists || undefined,
  }
}

export function channelStatisticsAdapter(
  statistics?: youtube_v3.Schema$ChannelStatistics,
): gapi.client.youtube.ChannelStatistics {
  return {
    commentCount: statistics?.commentCount || undefined,
    hiddenSubscriberCount: statistics?.hiddenSubscriberCount || undefined,
    subscriberCount: statistics?.subscriberCount || undefined,
    videoCount: statistics?.videoCount || undefined,
    viewCount: statistics?.viewCount || undefined,
  }
}

export function thumbnailDetailsAdapter(
  thumbnailDetails?: youtube_v3.Schema$ThumbnailDetails,
): gapi.client.youtube.ThumbnailDetails {
  return {
    default: thumbnailAdapter(thumbnailDetails?.default),
    high: thumbnailAdapter(thumbnailDetails?.high),
    maxres: thumbnailAdapter(thumbnailDetails?.maxres),
    medium: thumbnailAdapter(thumbnailDetails?.medium),
    standard: thumbnailAdapter(thumbnailDetails?.standard),
  }
}

export function thumbnailAdapter(
  thumbnail?: youtube_v3.Schema$Thumbnail,
): gapi.client.youtube.Thumbnail {
  return {
    height: thumbnail?.height || undefined,
    url: thumbnail?.url || undefined,
    width: thumbnail?.width || undefined,
  }
}

/*************************** TEXT RELATED HELPERS ******************************/
export function scaleWidthAndHeight(factor: number) {
  return { height: 390 * factor, width: 640 * factor }
}

export function stripLeadingAt(handle: string) {
  return handle.replace(/^@/, '')
}

export function stringifyCount(
  countResponse: string,
  decimalPlaces: number = 2,
) {
  const parsedCount = Number.parseInt(countResponse)

  if (parsedCount < 1000) {
    return parsedCount.toString()
  }

  const cutoffs = [1000, 1000 ** 2, 1000 ** 3, 1000 ** 4]
  const prefixIndex = cutoffs.findLastIndex(cutoff => parsedCount >= cutoff)
  const prefixes = ['K', 'M', 'B', 'T']
  return (
    (parsedCount / cutoffs[prefixIndex]).toFixed(decimalPlaces) +
    prefixes[prefixIndex]
  )
}

/**
 * Taken from https://gist.github.com/LewisJEllis/9ad1f35d102de8eee78f6bd081d486ad
 */
function stringifyDateRelativelyFactory(lang = 'en') {
  const cutoffs = [
    60,
    3600,
    86400,
    86400 * 7,
    86400 * 30,
    86400 * 365,
    Infinity,
  ]
  const units: Intl.RelativeTimeFormatUnit[] = [
    'second',
    'minute',
    'hour',
    'day',
    'week',
    'month',
    'year',
  ]
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  return function stringifyDateRelatively(dateString: string): string {
    const date = new Date(dateString)
    const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000)
    const unitIndex = cutoffs.findIndex(
      cutoff => cutoff > Math.abs(deltaSeconds),
    )
    const divisor = unitIndex ? cutoffs[unitIndex - 1] : 1
    return rtf.format(Math.round(deltaSeconds / divisor), units[unitIndex])
  }
}

export const stringifyDateRelatively = stringifyDateRelativelyFactory()

/** Only parses strings that start with PT (i.e. no date designators) */
export function parse8601PtTime(input: string): string {
  const match = input.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) {
    return 'Input is not a valid ISO 8601 duration'
  }
  const [, hours, minutes, seconds] = match
  return `${hours ? hours.slice(0, -1) + ':' : ''}${minutes ? minutes.slice(0, -1) + ':' : ''
    }${seconds ? seconds.slice(0, -1).padStart(2, '0') : ''}`
}

/*************************** GENERIC HELPERS ******************************/
export function mod(a: number, b: number) {
  return ((a % b) + b) % b
}

export function djb2(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i)
    hash = (hash << 5) - hash + charCode // hash * 31 + charCode
    hash |= 0 // Convert to 32-bit integer
  }
  return hash
}

export function murmurHash(str: string) {
  let hash = 0
  const seed = 0x5bd1e995 // Prime multiplier

  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i)
    hash = Math.imul(hash ^ charCode, seed) // Mix with the seed
    hash ^= hash >>> 13 // Right shift and XOR
  }

  // Finalize the hash (further mixing to ensure better randomness)
  hash ^= hash >>> 15
  hash = Math.imul(hash, seed)
  hash ^= hash >>> 13

  return hash >>> 0 // Convert to an unsigned 32-bit integer
}

/** Returns a new array */
export function binaryInsert<T, U>(
  arr: Array<T>,
  val: T,
  keyFn: (item: T) => U,
  descending: boolean = false,
) {
  if (arr.length === 0) {
    return [val]
  }
  let lo = 0
  let hi = arr.length - 1
  const target = keyFn(val)
  const compare = (a: U, b: U) => (descending ? a > b : a < b)
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2)
    if (compare(keyFn(arr[mid]), target)) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  if (compare(keyFn(arr[lo]), target)) {
    return arr.slice(0, lo + 1).concat(val, arr.slice(lo + 1))
  } else {
    return arr.slice(0, lo).concat(val, arr.slice(lo))
  }
}

export function isNotUndefined<T>(s: T | undefined): s is T {
  return !!s
}

export function isNotNull<T>(s: T | null): s is T {
  return s !== null
}

export function isDefined<T>(s: T | undefined | null): s is T {
  return s !== undefined && s !== null
}

export function sendPlaylistListMineRequest(
  setPlaylists: Dispatch<SetStateAction<gapi.client.youtube.Playlist[]>>
) {
  const baseParams = {
    part: 'snippet,contentDetails',
    mine: true,
  }
  gapi.client.youtube.playlists
    .list(baseParams)
    .then(playlistListResponse => handleNextPageResponses(
      playlistListResponse,
      gapi.client.youtube.playlists.list,
      baseParams
    )
    )
    .then(playlists => setPlaylists(playlists))
}

/**
 * Get 5 most recent videos from each subscription
 */
export function fetchSubscriptionUploadsRequestPipeline(
  channelIds: string[],
  setPlaylistVideoListInfo: Dispatch<SetStateAction<VideoListInfo>>,
  setIsPlaylistLoading: Dispatch<SetStateAction<boolean>>
) {
  // batch in 50s
  // for each subscription, get uploads playlist id
  // then get most recent playlistItems
  // then get video for each playlist
  const resultsPerSubscription = 5
  const isPlaylistLoading = []
  for (let i = 0; i < channelIds.length; i += 50) {
    isPlaylistLoading.push(
      new Promise(resolve => {
        const channels = gapi.client.youtube.channels.list({
          part: 'contentDetails',
          id: channelIds.slice(i, i + 50).join(),
        })

        const videos = channels
          .then(response => {
            // response.result.items must exist
            const nextRequests = response.result.items!.map(channelResult => gapi.client.youtube.playlistItems.list({
              part: 'snippet',
              playlistId: channelResult.contentDetails?.relatedPlaylists?.uploads,
              maxResults: resultsPerSubscription,
            })
            )

            // automatically flattened
            return Promise.all(nextRequests)
          })
          .then(playlistItemsResponses => {
            const flattened = playlistItemsResponses.flatMap(
              playlistItemsResponse => playlistItemsResponse.result.items || []
            )
            const result = []
            for (let i = 0; i < flattened.length; i += 50) {
              result.push(
                gapi.client.youtube.videos.list({
                  part: 'snippet,statistics',
                  id: flattened
                    .slice(i, i + 50)
                    .map(item => item.snippet?.resourceId?.videoId)
                    .join(),
                })
              )
            }
            return Promise.all(result)
          })

        Promise.all([videos, channels]).then(
          ([videoResponses, channelResponses]) => {
            setPlaylistVideoListInfo(prevInfo => {
              let { videos } = prevInfo
              const { channels } = prevInfo
              for (const channel of channelResponses.result.items || []) {
                channels[channel.id!] = channel
              }
              for (const videoResponse of videoResponses) {
                for (const video of videoResponse.result.items || []) {
                  videos = binaryInsert(
                    videos,
                    video,
                    // will cause videos to be unsorted if video.snippet is null
                    vKeyFn => vKeyFn.snippet?.publishedAt || '',
                    true
                  )
                }
              }

              resolve(true)

              return { videos, channels }
            })
          }
        )
      })
    )
  }

  Promise.all(isPlaylistLoading).then(() => setIsPlaylistLoading(false))
}

export function fetchSubscriptions(
  setSubscriptions: Dispatch<SetStateAction<FullSubscription[]>>
) {
  const baseParams = {
    part: 'snippet,contentDetails',
    mine: true,
  }
  gapi.client.youtube.subscriptions
    .list(baseParams)
    .then(response => handleNextPageResponses(
      response,
      gapi.client.youtube.subscriptions.list,
      baseParams
    )
    )
    .then(async (subscriptions) => {
      const channelRequests = []
      for (let i = 0; i < subscriptions.length; i += 50) {
        channelRequests.push(
          gapi.client.youtube.channels.list({
            part: 'snippet',
            id: subscriptions
              .slice(i, i + 50)
              .map(subscription => subscription.snippet?.resourceId?.channelId)
              .join(),
          })
        )
      }
      const channelResponses = await Promise.all(channelRequests)
      return {
        subscriptions,
        channelResponses,
      }
    })
    .then(fullResponses => {
      const subscriptions = fullResponses.subscriptions
      const channels = fullResponses.channelResponses.flatMap(
        response => response.result.items || []
      )
      // Join on channel ID
      const channelMap = channels.reduce(
        (acc: Record<string, gapi.client.youtube.Channel>, channel) => {
          if (channel.id) {
            acc[channel.id] = channel
          }
          return acc
        },
        {}
      )
      setSubscriptions(
        subscriptions.map(subscription => ({
          subscription,
          channel: channelMap[subscription.snippet?.resourceId?.channelId || ''],
        }))
      )
    })
}

export function fetchPlaylistItems(
  playlistId: string,
  setPlaylistVideoListInfo: React.Dispatch<React.SetStateAction<VideoListInfo>>,
  setIsPlaylistLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
  const baseParams = {
    part: 'snippet',
    playlistId: playlistId,
  }
  gapi.client.youtube.playlistItems
    .list(baseParams)
    .then(response => handlePlaylistItemsResponse(response, baseParams, []))
    .then(playlistItems => {
      // Collect all videos and channels
      const videos = playlistItems
        .map(playlistItem => playlistItem.snippet?.resourceId?.videoId)
        .filter(isNotUndefined)
      const channels = Array.from(
        new Set(
          playlistItems
            .map(playlistItem => playlistItem.snippet?.videoOwnerChannelId)
            .filter(isNotUndefined)
        )
      )

      const videoPromises: gapi.client.Request<gapi.client.youtube.VideoListResponse>[] = []
      for (let i = 0; i < videos.length; i += 50) {
        videoPromises.push(
          gapi.client.youtube.videos.list({
            part: 'snippet,statistics',
            id: videos.slice(i, i + 50).join(','),
          })
        )
      }
      const channelPromises: gapi.client.Request<gapi.client.youtube.ChannelListResponse>[] = []
      for (let i = 0; i < channels.length; i += 50) {
        channelPromises.push(
          gapi.client.youtube.channels.list({
            part: 'snippet',
            id: channels.slice(i, i + 50).join(','),
          })
        )
      }

      return Promise.all([...videoPromises, ...channelPromises])
    })
    .then(responses => {
      const videoResponses = responses.filter(
        (
          response
        ): response is gapi.client.Response<gapi.client.youtube.VideoListResponse> => response.result?.kind === 'youtube#videoListResponse'
      )
      const channelResponses = responses.filter(
        (
          response
        ): response is gapi.client.Response<gapi.client.youtube.ChannelListResponse> => response.result?.kind === 'youtube#channelListResponse'
      )

      const videoItems = videoResponses
        .flatMap(videoResponse => videoResponse.result?.items)
        .filter(isNotUndefined)
      const channelItems = channelResponses
        .flatMap(channelResponse => channelResponse.result?.items)
        .filter(isNotUndefined)
      if (!videoItems || !channelItems) {
        return
      }
      setPlaylistVideoListInfo({
        videos: videoItems,
        channels: channelItems.reduce(
          (acc: Record<string, gapi.client.youtube.Channel>, channel) => {
            if (channel.id) {
              acc[channel.id] = channel
            }
            return acc
          },
          {}
        ),
      })
      setIsPlaylistLoading(false)
    })
}
/** Limit to 50 comments for now */
export function loadComments(
  videoId: string,
  setComments: Dispatch<SetStateAction<gapi.client.youtube.Comment[]>>
) {
  gapi.client.youtube.commentThreads
    .list({
      part: 'snippet',
      videoId: videoId,
    })
    .then(response => {
      const comments = response.result?.items
        ?.map(item => item.snippet?.topLevelComment)
        .filter(isNotUndefined)
      if (comments) {
        setComments(comments)
      }
    })
}

