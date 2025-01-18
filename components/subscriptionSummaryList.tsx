import { useState } from 'react'
import SubscriptionCard from './subscriptionCard'
import { useRef } from 'react'

function handleToggle(
  event: React.SyntheticEvent<HTMLDetailsElement>,
  inputRef: React.RefObject<HTMLInputElement | null>,
) {
  const details = event.currentTarget
  if (details.open && inputRef.current) {
    inputRef.current.focus()
  }
}

export default function SubscriptionSummaryList({
  subscriptions,
  channels,
  channelMap,
}: Readonly<{
  subscriptions: gapi.client.youtube.Subscription[]
  channels: gapi.client.youtube.Channel[]
  channelMap: Record<string, gapi.client.youtube.Channel>
}>) {
  const [subscriptionSearch, setSubscriptionSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <details className='w-[97%]' onToggle={e => handleToggle(e, inputRef)}>
      <summary className='text-center cursor-default'>Subscriptions</summary>
      <input
        className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-0.5 m-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 focus:placeholder-transparent'
        placeholder='Search subscriptions...'
        value={subscriptionSearch}
        onChange={e => setSubscriptionSearch(e.target.value)}
        ref={inputRef}
      />
      <div className='flex flex-row space-x-3 overflow-x-auto pb-3'>
        {channels.length === subscriptions.length &&
          subscriptions
            ?.filter(subscription => {
              const channel =
                channelMap[subscription.snippet?.resourceId?.channelId || '']
              return (
                channel.snippet?.title
                  ?.toLowerCase()
                  .includes(subscriptionSearch.toLowerCase()) ||
                channel.snippet?.description
                  ?.toLowerCase()
                  .includes(subscriptionSearch.toLowerCase())
              )
            })
            .map(subscription => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                channelMap={channelMap}
              />
            ))}
      </div>
    </details>
  )
}
