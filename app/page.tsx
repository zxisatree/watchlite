'use client'

import { useContext, useEffect, useState } from 'react'
import { EnvContext } from './ctxt'
import {
  chooseThumbnail,
  sendChannelListRequestConcat,
  sendSubscriptionsListRequest,
  sendSubscriptionUploadsRequestPipeline,
} from './utils'
import SearchResult from '@/components/searchResult'
import CircularImage from '@/components/circularImage'
import { FullSearchResult } from './types'

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
  const channelMap: Record<string, gapi.client.youtube.Channel> = {}
  channels.forEach(channel => {
    if (channel.id) {
      channelMap[channel.id] = channel
    }
  })

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
      <div className='flex space-x-2 mt-2'>
        <div className='bg-gray-200 p-2 rounded-lg'>
          Is OAuth token valid?{' '}
          {!oauthToken ||
          !oauthToken.expiry_date ||
          new Date() >= oauthToken.expiry_date
            ? 'No'
            : 'Yes'}
        </div>
      </div>
      <details className='space-y-1'>
        <summary className='text-center'>Subscriptions</summary>
        {channels.length === subscriptions.length &&
          subscriptions?.map(subscription => {
            // should always be defined if channels have all been fetched
            const channelId = subscription.snippet?.resourceId?.channelId || ''
            const channelDetails = channelMap[channelId]
            const channelThumbnails = channelDetails.snippet?.thumbnails
            return (
              <div className='flex space-x-2' key={subscription.id || 'empty'}>
                {channelThumbnails && (
                  <CircularImage
                    thumbnail={chooseThumbnail(channelThumbnails)}
                    diameter={24}
                  />
                )}
                <div>
                  {subscription.snippet?.title}
                  {' - '}
                  {channelDetails && channelDetails.snippet?.customUrl}
                </div>
              </div>
            )
          })}
      </details>
      <div className='text-4xl my-4 pt-2 border-t-2 border-gray-500 w-full text-center'>
        Subscription videos
      </div>
      {subscriptionVideos.map(video => {
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
