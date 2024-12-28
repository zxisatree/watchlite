import Link from "next/link";

type SearchResultProps = {
  result: gapi.client.youtube.SearchResult;
};

export default function SearchResult({ result }: SearchResultProps) {
  return (
    <Link href={`/play?v=${result.id?.videoId}`}>
      {result.snippet?.title || "Title not found"}
    </Link>
  );
}
