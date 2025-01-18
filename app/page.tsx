'use client'

import { useContext, useEffect, useState } from 'react'
import { EnvContext } from './ctxt'
import {
  sendChannelListRequestConcat,
  sendSubscriptionsListRequest,
  sendSubscriptionUploadsRequestPipeline,
} from './utils'
import SearchResult from '@/components/searchResult'
import { FullSearchResult } from './types'
import SubscriptionSummaryList from '@/components/subscriptionSummaryList'

export default function Page() {
  const {
    gapiIsInitialised,
    subscriptions,
    setSubscriptions,
    oauthToken,
    gapiRequestCount,
    setGapiRequestCount,
  } = useContext(EnvContext)
  const [channels, setChannels] = useState<gapi.client.youtube.Channel[]>([])
  const [subscriptionVideos, setSubscriptionVideos] = useState<
    gapi.client.youtube.Video[]
  >([])
  const gapiRequestLimit = 5
  const maxSubscriptionVideoCount = 15
  const isOauthTokenValid = !(
    !oauthToken ||
    !oauthToken.expiry_date ||
    new Date() >= oauthToken.expiry_date
  )
  console.log('isOauthTokenValid: ', isOauthTokenValid)
  console.log('date:')
  console.log(new Date())
  console.log('expiry_date:')
  console.log(oauthToken?.expiry_date)
  console.log('date > expiry_date:')
  console.log(oauthToken && new Date() >= oauthToken.expiry_date)

  const channelMap: Record<string, gapi.client.youtube.Channel> = {}
  channels.forEach(channel => {
    if (channel.id) {
      channelMap[channel.id] = channel
    }
  })

  // console.log(`subscriptionVideos.slice(0, ${maxSubscriptionVideoCount}):`)
  // console.log(
  //   subscriptionVideos
  //     .slice(0, maxSubscriptionVideoCount)
  //     .map(video => video.snippet),
  // )
  console.log('subscriptions:')
  console.log(subscriptions.map(s => s.snippet))
  // map subscription ID to count
  // const subscriptionIdCount: Record<string, number> = {}
  // subscriptions.forEach(subscription => {
  //   const channelId = subscription.snippet?.resourceId?.channelId
  //   if (channelId) {
  //     subscriptionIdCount[channelId] = (subscriptionIdCount[channelId] || 0) + 1
  //   }
  // })
  // console.log('subscriptionIdCount:')
  // console.log(subscriptionIdCount)

  useEffect(() => {
    if (gapiIsInitialised && oauthToken) {
      if (new Date() < oauthToken.expiry_date) {
        if (gapiRequestCount > gapiRequestLimit) {
          console.log(
            `gapiRequestCount exceeded ${gapiRequestLimit}, not sending request`,
          )
          return
        }
        setGapiRequestCount(gapiRequestCount + 1)
        sendSubscriptionsListRequest(oauthToken.access_token, setSubscriptions)
      }
    }
  }, [gapiIsInitialised, oauthToken])

  useEffect(() => {
    const channelIds = subscriptions.map(
      subscription => subscription.snippet?.resourceId?.channelId || '',
    )
    if (channelIds.length > 0) {
      if (gapiRequestCount > gapiRequestLimit) {
        console.log(
          `gapiRequestCount exceeded ${gapiRequestLimit}, not sending request`,
        )
        return
      }
      setGapiRequestCount(gapiRequestCount + 1)

      // batch in 50s (max filter size)
      for (let i = 0; i < channelIds.length; i += 50) {
        sendChannelListRequestConcat(channelIds.slice(i, i + 50), setChannels)
      }

      // get subscription videos
      sendSubscriptionUploadsRequestPipeline(
        subscriptions.map(
          subscription => subscription.snippet?.resourceId?.channelId || '',
        ),
        setSubscriptionVideos,
      )
    }
  }, [subscriptions])

  return (
    <div className='flex flex-col justify-center items-center'>
      {isOauthTokenValid ? (
        <div className='bg-green-200 p-2 rounded-lg mt-2'>
          OAuth token is valid!
        </div>
      ) : (
        <div className='bg-red-200 p-2 rounded-lg mt-2'>
          Invalid OAuth token.
        </div>
      )}
      <SubscriptionSummaryList
        subscriptions={subscriptions}
        channels={channels}
        channelMap={channelMap}
      />
      <div className='text-4xl my-4 pt-2 border-t-2 border-gray-500 w-full text-center'>
        Subscription videos (first {maxSubscriptionVideoCount})
      </div>
      {subscriptionVideos.slice(0, maxSubscriptionVideoCount).map(video => {
        const channelId = video.snippet?.channelId
        const result: FullSearchResult = { video }
        if (channelId && channelId in channelMap) {
          result.channel = channelMap[channelId]
        }
        return <SearchResult key={video.id} fullResult={result} />
      })}
    </div>
  )
}
