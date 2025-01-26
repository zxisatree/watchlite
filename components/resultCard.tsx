// Client component
export default function ResultCard({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='w-[70%] min-w-[750px] p-1 mb-2 max-h-[360px] flex flex-row bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors'>
      {children}
    </div>
  )
}
