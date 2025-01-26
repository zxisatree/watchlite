import ChannelPage from './channelPage'

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  return <ChannelPage channelHandle={slug} />
}
