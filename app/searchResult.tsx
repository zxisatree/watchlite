type SearchResultProps = {
  result: gapi.client.youtube.SearchResult;
};

export default function SearchResult({ result }: SearchResultProps) {
  return <div>{result.snippet?.title || "Title not found"}</div>;
}
