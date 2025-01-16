import Image from 'next/image'

export default function CircularImage({
  thumbnail,
  diameter,
}: {
  thumbnail: gapi.client.youtube.Thumbnail
  diameter: number
}) {
  return (
    <Image
      className='rounded-full aspect-square object-cover'
      src={thumbnail.url || '/default_thumbnail.png'}
      alt={`${thumbnail.url} thumbnail`}
      width={diameter}
      height={diameter}
    />
  )
}
