import {
  DependencyList,
  Dispatch,
  EffectCallback,
  SetStateAction,
  useEffect,
  useRef,
} from 'react'
import { FullSearchResult, OauthTokenState, VideoListInfo } from './types'

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

export function sendVideoStatsRequest(
  videoIds: string[],
  setVideoResults: Dispatch<SetStateAction<gapi.client.youtube.Video[]>>,
) {
  const videoListRequest = gapi.client.youtube.videos.list({
    part: 'snippet,statistics',
    id: videoIds.join(),
  })

  videoListRequest.execute(function (
    response: gapi.client.Response<gapi.client.youtube.VideoListResponse>,
  ) {
    const videoList = response.result
    setVideoResults(videoList.items || [])
  })
}

export function sendChannelListRequest(
  channelIds: string[],
  setChannelResults: Dispatch<SetStateAction<gapi.client.youtube.Channel[]>>,
) {
  const channelListRequest = gapi.client.youtube.channels.list({
    part: 'snippet',
    id: channelIds.join(),
  })
  channelListRequest.execute(function (
    response: gapi.client.Response<gapi.client.youtube.ChannelListResponse>,
  ) {
    const channelList = response.result
    setChannelResults(channelList.items || [])
  })
}

/** Add to existing list of channels instead of replacing */
export function sendChannelListRequestConcat(
  channelIds: string[],
  setChannelResults: Dispatch<SetStateAction<gapi.client.youtube.Channel[]>>,
) {
  const channelListRequest = gapi.client.youtube.channels.list({
    part: 'snippet',
    id: channelIds.join(),
  })
  channelListRequest.execute(function (
    response: gapi.client.Response<gapi.client.youtube.ChannelListResponse>,
  ) {
    const channelList = response.result
    setChannelResults(prevChannels => [
      ...prevChannels,
      ...(channelList.items || []),
    ])
  })
}

/**
 * Get 5 most recent videos from each subscription
 */
export function sendSubscriptionUploadsRequestPipeline(
  channelIds: string[],
  setPipelineResults: Dispatch<SetStateAction<gapi.client.youtube.Video[]>>,
) {
  // batch in 50s
  // for each subscription, get uploads playlist id
  // then get most recent playlistItems
  // then get video for each playlist
  const resultsPerSubscription = 5
  for (let i = 0; i < channelIds.length; i += 50) {
    gapi.client.youtube.channels
      .list({
        part: 'contentDetails',
        id: channelIds.slice(i, i + 50).join(),
      })
      .then(response => {
        // response.result.items must exist
        const nextRequests = response.result.items!.map(channelResult =>
          gapi.client.youtube.playlistItems.list({
            part: 'snippet',
            playlistId: channelResult.contentDetails?.relatedPlaylists?.uploads,
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
      .then(videoResponses => {
        setPipelineResults(prevResults => {
          let result = prevResults
          for (const videoResponse of videoResponses) {
            for (const video of videoResponse.result.items || []) {
              result = binaryInsert(
                result,
                video,
                // will cause videos to be unsorted if video.snippet is null
                vKeyFn => vKeyFn.snippet?.publishedAt || '',
              )
            }
          }
          return result.reverse()
        })
      })
  }
}

export function sendQueryRequest(
  queryString: string,
  setSearchResults: Dispatch<
    SetStateAction<gapi.client.youtube.SearchResult[]>
  >,
) {
  const searchListRequest = gapi.client.youtube.search.list({
    part: 'snippet',
    q: queryString,
    maxResults: 10,
  })

  searchListRequest.execute(function (
    response: gapi.client.Response<gapi.client.youtube.SearchListResponse>,
  ) {
    const searchList = response.result
    setSearchResults(searchList.items || [])
  })
}

export function sendSubscriptionsListRequest(
  setSubscriptions: Dispatch<
    SetStateAction<gapi.client.youtube.Subscription[]>
  >,
) {
  // reset
  setSubscriptions([])

  const baseParams = {
    part: 'contentDetails,snippet',
    mine: true,
  }
  const subscriptionsRequest =
    gapi.client.youtube.subscriptions.list(baseParams)

  let allSubscriptions: gapi.client.youtube.Subscription[] = []

  function handleSubscriptionResponse(
    response: gapi.client.Response<gapi.client.youtube.SubscriptionListResponse>,
  ) {
    const responseResult = response.result
    const responseItems = responseResult.items

    if (!responseItems) {
      return
    }

    allSubscriptions = allSubscriptions.concat(responseItems)
    const nextPageToken = responseResult.nextPageToken

    if (nextPageToken) {
      const nextPageParams = {
        ...baseParams,
        pageToken: nextPageToken,
      }
      const nextPageRequest =
        gapi.client.youtube.subscriptions.list(nextPageParams)
      // console.log(`nextPageToken: ${nextPageToken}`)
      nextPageRequest.execute(handleSubscriptionResponse)
    } else {
      setSubscriptions(allSubscriptions)
    }
  }

  subscriptionsRequest.execute(handleSubscriptionResponse)
}

export function fetchPlaylistItems(
  playlist: gapi.client.youtube.Playlist,
  setPlaylistVideoListInfo: React.Dispatch<React.SetStateAction<VideoListInfo>>,
  setIsPlaylistLoading: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const baseParams = {
    part: 'snippet',
    playlistId: playlist.id,
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

// Will return empty string if result.is is null
export function keySearchResultById(result: FullSearchResult): string {
  return [
    result.searchResult?.id?.channelId,
    result.searchResult?.id?.playlistId,
    result.searchResult?.id?.videoId,
  ]
    .filter(Boolean)
    .join()
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

export function sendPlaylistListRequest(
  setPlaylists: Dispatch<SetStateAction<gapi.client.youtube.Playlist[]>>,
) {
  const baseParams = {
    part: 'snippet,contentDetails',
    mine: true,
  }
  const playlistsRequest = gapi.client.youtube.playlists.list(baseParams)

  let allPlaylists: gapi.client.youtube.Playlist[] = []

  function handlePlaylistResponse(
    response: gapi.client.Response<gapi.client.youtube.PlaylistListResponse>,
  ) {
    const responseResult = response.result
    const responseItems = responseResult.items

    if (!responseItems) {
      return
    }

    allPlaylists = allPlaylists.concat(responseItems)
    const nextPageToken = responseResult.nextPageToken

    if (nextPageToken) {
      const nextPageParams = {
        ...baseParams,
        pageToken: nextPageToken,
      }
      const nextPageRequest = gapi.client.youtube.playlists.list(nextPageParams)
      nextPageRequest.execute(handlePlaylistResponse)
    } else {
      setPlaylists(allPlaylists)
    }
  }

  playlistsRequest.execute(handlePlaylistResponse)
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

/*************************** YOUTUBE RELATED HELPERS ******************************/

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
) {
  if (arr.length === 0) {
    return [val]
  }
  let lo = 0
  let hi = arr.length - 1
  const target = keyFn(val)
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2)
    if (keyFn(arr[mid]) < target) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  if (keyFn(arr[lo]) < target) {
    return arr.slice(0, lo + 1).concat(val, arr.slice(lo + 1))
  } else {
    return arr.slice(0, lo).concat(val, arr.slice(lo))
  }
}

export function isNotUndefined<T>(s: T | undefined): s is T {
  return !!s
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
