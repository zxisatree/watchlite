import { Dispatch, SetStateAction } from "react";

export function initGapi(apiKey: string) {
  gapi.load("client", async function () {
    gapi.client.init({
      apiKey: apiKey,
      discoveryDocs: [
        "https://youtube.googleapis.com/$discovery/rest?version=v3",
      ],
    });
  });
}

export function sendQueryRequest(
  queryString: string,
  setResults: Dispatch<SetStateAction<gapi.client.youtube.SearchResult[]>>
) {
  const request = gapi.client.youtube.search.list({
    part: "snippet",
    q: queryString,
    maxResults: 10,
  });

  request.execute(function (
    response: gapi.client.Response<gapi.client.youtube.SearchListResponse>
  ) {
    const searchList = response.result;
    // console.log("results:");
    // console.log(searchList);
    // console.log("items:");
    // console.log(searchList.items?.map((item) => item.snippet));
    setResults(searchList.items || []);
  });
}
