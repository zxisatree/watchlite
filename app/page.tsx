import Search from "./search";

export default async function Home() {
  // console.log("from page.tsx:");
  // console.log(process.env.YOUTUBE_API_KEY);
  const apiKey = process.env.YOUTUBE_API_KEY || "";

  return (
    <>
      <div className="w-full h-full flex flex-col justify-center items-center">
        <Search apiKey={apiKey} />
      </div>
    </>
  );
}
