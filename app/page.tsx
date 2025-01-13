'use client'

import { useContext, useEffect, useState } from 'react'
import { EnvContext } from './ctxt'
import {
  greenButton,
  sendChannelListRequestConcat,
  sendSubscriptionsListRequest,
  sendSubscriptionUploadsRequestPipeline,
} from './utils'
import SearchResult from '@/components/searchResult'

export default function Page() {
  const { gapiIsInitialised, subscriptions, setSubscriptions, oauthToken } =
    useContext(EnvContext)
  const [channels, setChannels] = useState<gapi.client.youtube.Channel[]>([])
  const channelMap: Record<string, gapi.client.youtube.Channel> = {}
  channels.forEach(channel => {
    if (channel.id) {
      channelMap[channel.id] = channel
    }
  })
  const channelIds = subscriptions.map(
    subscription => subscription.snippet?.resourceId?.channelId || '',
  )

  const [subscriptionVideos, setSubscriptionVideos] = useState<
    gapi.client.youtube.Video[]
  >([])

  useEffect(() => {
    if (gapiIsInitialised && oauthToken) {
      if (new Date() < oauthToken.expiry_date) {
        sendSubscriptionsListRequest(oauthToken.access_token, setSubscriptions)
      }
    }
  }, [gapiIsInitialised, oauthToken])

  useEffect(() => {
    if (channelIds.length > 0) {
      // batch in 50s (max filter size)
      for (let i = 0; i < channelIds.length; i += 50) {
        sendChannelListRequestConcat(channelIds.slice(i, i + 50), setChannels)
      }
    }
  }, [channelIds])

  return (
    <div className='flex flex-col justify-center items-center'>
      <div className='flex space-x-2 mt-2'>
        <button
          type='button'
          className={greenButton}
          onClick={() => {
            const accessToken = oauthToken?.access_token
            if (accessToken) {
              console.log('starting subscription pipeline')
              sendSubscriptionUploadsRequestPipeline(
                channelIds,
                setSubscriptionVideos,
              )
            } else {
              console.error(
                'No access token found. Please sign in via OAuth to retrieve subscriptions',
              )
            }
          }}
          disabled={!gapiIsInitialised || subscriptions.length === 0}
        >
          Run subscription pipeline
        </button>
        <div className='bg-gray-200 p-2 rounded-lg'>
          Is OAuth token valid?{' '}
          {!oauthToken ||
          !oauthToken.expiry_date ||
          new Date() >= oauthToken.expiry_date
            ? 'No'
            : 'Yes'}
        </div>
      </div>
      Subscriptions
      {subscriptions?.map(subscription => (
        <div key={subscription.id}>
          {subscription.snippet?.title}
          {' - '}
          {channelMap[subscription.snippet?.resourceId?.channelId || ''] &&
            channelMap[subscription.snippet?.resourceId?.channelId || '']
              .snippet?.customUrl}
        </div>
      ))}
      <div className='text-4xl my-4 pt-2 border-t-2 border-gray-500 w-full text-center'>
        Subscription videos
      </div>
      {subscriptionVideos.map(video => (
        <SearchResult key={video.id} fullResult={{ video }} />
      ))}
    </div>
  )
}
