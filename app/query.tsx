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
    // console.log("results:");
    // console.log(searchList);
    // console.log("items:");
    // console.log(searchList.items?.map((item) => item.snippet));
    setSearchResults(searchList.items || [])
  })
}

export function getSubscriptions(accessToken: string) {
  const subscriptionsRequest = gapi.client.youtube.subscriptions.list({
    access_token: accessToken,
    part: 'contentDetails,id,snippet,subscriberSnippet',
    mine: true,
  })

  console.log(`getSubscriptions access_token: ${accessToken}`)

  subscriptionsRequest.execute(function (
    response: gapi.client.Response<gapi.client.youtube.SubscriptionListResponse>,
  ) {
    const subscriptions = response.result
    console.log('subscriptions result:')
    console.log(subscriptions)
  })
}
