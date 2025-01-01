import Search from './search'

export default async function Home() {
  // console.log("from page.tsx:");
  // console.log(process.env.YOUTUBE_API_KEY);
  const apiKey = process.env.YOUTUBE_API_KEY || ''

  return (
    <>
      <div className='sticky top-0'>header</div>
      <div className='flex flex-col justify-center items-center'>
        <Search apiKey={apiKey} />
      </div>
    </>
  )
}
