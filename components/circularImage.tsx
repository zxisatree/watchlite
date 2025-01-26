import Image from 'next/image'

export default function CircularImage({
  thumbnailUrl,
  diameter = 24,
}: {
  thumbnailUrl: string | undefined
  diameter?: number
}) {
  return (
    // Reset flex
    <div>
      <Image
        className='rounded-full aspect-square object-cover'
        src={thumbnailUrl || '/default_thumbnail.png'}
        alt={`${thumbnailUrl} thumbnail`}
        width={diameter}
        height={diameter}
      />
    </div>
  )
}
