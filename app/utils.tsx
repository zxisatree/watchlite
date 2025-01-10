import { Dispatch, SetStateAction } from 'react'

export function initGapi(
  apiKey: string,
  setIsInitialised: Dispatch<SetStateAction<boolean>>,
) {
  console.log('Initialising...')
  gapi.load('client', async function () {
    gapi.client.init({
      apiKey: apiKey,
      discoveryDocs: [
        'https://youtube.googleapis.com/$discovery/rest?version=v3',
      ],
    })
    console.log('Initialised.')
    setIsInitialised(true)
  })
}

export function sendVideoStatsRequest(
  videoIds: string[],
  setVideoResults: Dispatch<SetStateAction<gapi.client.youtube.Video[] | null>>,
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

export function sendChannelThumbnailRequest(
  channelIds: string[],
  setChannelResults: Dispatch<
    SetStateAction<gapi.client.youtube.Channel[] | null>
  >,
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

export function sendQueryRequest(
  queryString: string,
  setSearchResults: Dispatch<
    SetStateAction<gapi.client.youtube.SearchResult[] | null>
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
  accessToken: string,
  setSubscriptions: Dispatch<
    SetStateAction<gapi.client.youtube.Subscription[] | null>
  >,
) {
  const baseParams = {
    access_token: accessToken,
    part: 'contentDetails,id,snippet,subscriberSnippet',
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
      console.log(`nextPageToken: ${nextPageToken}`)
      nextPageRequest.execute(handleSubscriptionResponse)
    } else {
      setSubscriptions(allSubscriptions)
    }
  }

  subscriptionsRequest.execute(handleSubscriptionResponse)
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
