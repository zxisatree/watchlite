import { Dispatch, SetStateAction } from 'react'

export function initGapi(
  apiKey: string,
  setIsInitialised: Dispatch<SetStateAction<boolean>>,
) {
  gapi.load('client', async function () {
    gapi.client.init({
      apiKey: apiKey,
      discoveryDocs: [
        'https://youtube.googleapis.com/$discovery/rest?version=v3',
      ],
    })
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
