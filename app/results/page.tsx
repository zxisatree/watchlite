import SearchResult from '@/components/searchResult'
import { keySearchResultById } from '../../utils/utils'
import { fetchSearchResults } from '../../utils/googleapisUtils'

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ search_query: string }>
}) {
  const query = (await searchParams).search_query
  const searchResults = await fetchSearchResults(query)

  if (query === null || query === '') {
    return <div>Query is empty, enter a search query into the search bar!</div>
  }

  return (
    <div className='flex flex-col justify-center items-center mt-2'>
      {searchResults?.map(result => (
        <SearchResult key={keySearchResultById(result)} searchResult={result} />
      ))}
    </div>
  )
}
