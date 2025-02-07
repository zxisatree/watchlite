import {
  DependencyList,
  Dispatch,
  EffectCallback,
  SetStateAction,
  useEffect,
  useRef,
} from 'react'
import {
  ChannelSearchResult,
  FullSearchResult,
  FullSubscription,
  OauthTokenState,
  PlaylistItemInfo,
  PlaylistSearchResult,
  VideoListInfo,
  VideoSearchResult,
} from './types'

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

export function sendPlaylistListMineRequest(
  setPlaylists: Dispatch<SetStateAction<gapi.client.youtube.Playlist[]>>,
) {
  const baseParams = {
    part: 'snippet,contentDetails',
    mine: true,
  }
  gapi.client.youtube.playlists
    .list(baseParams)
    .then(playlistListResponse =>
      handleNextPageResponses(
        playlistListResponse,
        gapi.client.youtube.playlists.list,
        baseParams,
      ),
    )
    .then(playlists => setPlaylists(playlists))
}

export function fetchSearchPlaylistItems(
  playlistIds: string[],
): Promise<Map<string, PlaylistItemInfo[]>> {
  // for each playlist, list playlist items, then get videos for each playlist item
  return Promise.all(
    playlistIds.map(playlistId =>
      gapi.client.youtube.playlistItems
        .list({
          part: 'snippet,contentDetails',
          playlistId,
        })
        .then(async playlistItemsResponse => {
          const playlistItems = playlistItemsResponse.result.items
          const videosResponse = await gapi.client.youtube.videos.list({
            part: 'contentDetails',
            id: playlistItems
              ?.map(playlistItem => playlistItem.snippet?.resourceId?.videoId)
              .join(),
          })
          return {
            playlistItems: playlistItems || [],
            videos: videosResponse.result.items || [],
          }
        }),
    ),
  ).then(playlistData => {
    const info = new Map()
    for (let i = 0; i < playlistData.length; i++) {
      const playlistInfo = playlistData[i]
      if (playlistInfo.videos.length !== playlistInfo.playlistItems.length) {
        console.error(
          `playlistInfo.videos.length !== playlistInfo.playlistItems.length: ${playlistInfo.videos.length} !== ${playlistInfo.playlistItems.length}`,
        )
        return info
      }

      info.set(
        playlistIds[i],
        (info.get(playlistIds[i]) || []).concat(
          playlistInfo.videos.map((video, index) => ({
            playlistItem: playlistInfo.playlistItems[index],
            video: video,
          })),
        ),
      )
    }
    return info
  })
}

export function fetchSearchResults(
  query: string,
  setSearchResults: Dispatch<SetStateAction<FullSearchResult[]>>,
) {
  gapi.client.youtube.search
    .list({
      part: 'snippet',
      q: query,
      maxResults: 25,
    })
    .then(async response => {
      const searchResults = response.result.items || []
      const videoResults = searchResults
        .map(searchResult => searchResult.id?.videoId)
        .filter(isNotUndefined)
      const channelResults = searchResults
        .map(searchResult => searchResult.snippet?.channelId)
        .filter(isNotUndefined)
      const playlistResults = searchResults
        .map(searchResult => searchResult.id?.playlistId)
        .filter(isNotUndefined)

      const videoRequest = gapi.client.youtube.videos
        .list({
          part: 'snippet,statistics',
          id: videoResults.join(),
        })
        .then(response => {
          return response.result.items || []
        })

      const channelRequest = gapi.client.youtube.channels
        .list({
          part: 'snippet',
          id: channelResults.join(),
        })
        .then(response => {
          return response.result.items || []
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

      setSearchResults(
        searchResults
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
                playlistItemInfos: playlistIdToResult.get(
                  searchResultPlaylistId,
                ),
              }
            } else {
              console.error('invalid search result')
              return null
            }
          })
          .filter(isNotNull),
      )
    })
}

/**
 * Get 5 most recent videos from each subscription
 */
export function fetchSubscriptionUploadsRequestPipeline(
  channelIds: string[],
  setPlaylistVideoListInfo: Dispatch<SetStateAction<VideoListInfo>>,
  setIsPlaylistLoading: Dispatch<SetStateAction<boolean>>,
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
            const nextRequests = response.result.items!.map(channelResult =>
              gapi.client.youtube.playlistItems.list({
                part: 'snippet',
                playlistId:
                  channelResult.contentDetails?.relatedPlaylists?.uploads,
                maxResults: resultsPerSubscription,
              }),
            )

            // automatically flattened
            return Promise.all(nextRequests)
          })
          .then(playlistItemsResponses => {
            const flattened = playlistItemsResponses.flatMap(
              playlistItemsResponse => playlistItemsResponse.result.items || [],
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
                }),
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
                    true,
                  )
                }
              }

              resolve(true)

              return { videos, channels }
            })
          },
        )
      }),
    )
  }

  Promise.all(isPlaylistLoading).then(() => setIsPlaylistLoading(false))
}

export function fetchSubscriptions(
  setSubscriptions: Dispatch<SetStateAction<FullSubscription[]>>,
) {
  const baseParams = {
    part: 'snippet,contentDetails',
    mine: true,
  }
  gapi.client.youtube.subscriptions
    .list(baseParams)
    .then(response =>
      handleNextPageResponses(
        response,
        gapi.client.youtube.subscriptions.list,
        baseParams,
      ),
    )
    .then(async subscriptions => {
      const channelRequests = []
      for (let i = 0; i < subscriptions.length; i += 50) {
        channelRequests.push(
          gapi.client.youtube.channels.list({
            part: 'snippet',
            id: subscriptions
              .slice(i, i + 50)
              .map(subscription => subscription.snippet?.resourceId?.channelId)
              .join(),
          }),
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
        response => response.result.items || [],
      )
      // Join on channel ID
      const channelMap = channels.reduce(
        (acc: Record<string, gapi.client.youtube.Channel>, channel) => {
          if (channel.id) {
            acc[channel.id] = channel
          }
          return acc
        },
        {},
      )
      setSubscriptions(
        subscriptions.map(subscription => ({
          subscription,
          channel:
            channelMap[subscription.snippet?.resourceId?.channelId || ''],
        })),
      )
    })
}

export function fetchPlaylistItems(
  playlistId: string,
  setPlaylistVideoListInfo: React.Dispatch<React.SetStateAction<VideoListInfo>>,
  setIsPlaylistLoading: React.Dispatch<React.SetStateAction<boolean>>,
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
            .filter(isNotUndefined),
        ),
      )

      const videoPromises: gapi.client.Request<gapi.client.youtube.VideoListResponse>[] =
        []
      for (let i = 0; i < videos.length; i += 50) {
        videoPromises.push(
          gapi.client.youtube.videos.list({
            part: 'snippet,statistics',
            id: videos.slice(i, i + 50).join(','),
          }),
        )
      }
      const channelPromises: gapi.client.Request<gapi.client.youtube.ChannelListResponse>[] =
        []
      for (let i = 0; i < channels.length; i += 50) {
        channelPromises.push(
          gapi.client.youtube.channels.list({
            part: 'snippet',
            id: channels.slice(i, i + 50).join(','),
          }),
        )
      }

      return Promise.all([...videoPromises, ...channelPromises])
    })
    .then(responses => {
      const videoResponses = responses.filter(
        (
          response,
        ): response is gapi.client.Response<gapi.client.youtube.VideoListResponse> =>
          response.result?.kind === 'youtube#videoListResponse',
      )
      const channelResponses = responses.filter(
        (
          response,
        ): response is gapi.client.Response<gapi.client.youtube.ChannelListResponse> =>
          response.result?.kind === 'youtube#channelListResponse',
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
          {},
        ),
      })
      setIsPlaylistLoading(false)
    })
}

/** Limit to 50 comments for now */
export function loadComments(
  videoId: string,
  setComments: Dispatch<SetStateAction<gapi.client.youtube.Comment[]>>,
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

/*************************** TEXT RELATED HELPERS ******************************/
export function scaleWidthAndHeight(factor: number) {
  return { height: 390 * factor, width: 640 * factor }
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
  return `${hours ? hours.slice(0, -1) + ':' : ''}${
    minutes ? minutes.slice(0, -1) + ':' : ''
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

/*************************** REACT HELPERS ******************************/
export function usePrevious<T>(value: T, initialValue: T) {
  const ref = useRef(initialValue)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export function useEffectDebugger(
  effectHook: EffectCallback,
  dependencies: DependencyList,
  dependencyNames: string[] = [],
) {
  const previousDeps = usePrevious(dependencies, [])

  const changedDeps = dependencies.reduce(
    (
      acc: Record<string | number, { before: unknown; after: unknown }>,
      dependency,
      index,
    ) => {
      if (dependency !== previousDeps[index]) {
        const keyName = dependencyNames[index] || index
        return {
          ...acc,
          [keyName]: {
            before: previousDeps[index],
            after: dependency,
          },
        }
      }

      return acc
    },
    {},
  )

  if (Object.keys(changedDeps).length) {
    console.log('[use-effect-debugger] ', changedDeps)
  }

  useEffect(effectHook, dependencies)
}
