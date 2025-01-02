import SearchPage from './searchPage'

export default async function Home() {
  const apiKey = process.env.YOUTUBE_API_KEY || ''

  return <SearchPage apiKey={apiKey} />
}
