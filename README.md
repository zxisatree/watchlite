# WatchLite

_Minimalistic Youtube UI_

There are too many useless features on Youtube that I don't use, like the home
page, TV casting, your own channel's videos, like buttons etc etc. and some
things that are purely for Youtube's economic benefit, like video suggestions.
WatchLite is an alternative UI for Youtube that removes these distractions for a
clean, stress free experience.

Note: Watch Later and saved playlists not created by the authenticated user are
not available as Youtube's Data V3 API does not expose it.

## Getting Started

1. Create a Google cloud project
2. In the Google Cloud console, click on Credentials, then add an API key and
   OAuth 2.0 Client ID
3. Click on the OAuth Client ID to edit it, and add `/oauth2callback` to the
   authorised redirect URIs
4. In the Google Cloud console, click on OAuth Consent Screen, and add your
   Google account as a test user
5. Create a `.env` file in the root folder and add these 3 keys:
   1. `GAPI_API_KEY`
   2. `GAPI_CLIENT_ID`
   3. `GAPI_CLIENT_SECRET`
6. Run the development server with `npm run dev`

To log in via OAuth, click the OAuth button in the top left. After you log in
for the first time, you can use the Refresh OAuth Token button to request a new
valid OAuth token. Check the status of your OAuth token on the home page `/`.

## Privacy

For Google API's OAuth scopes,
"https://www.googleapis.com/auth/youtube.readonly" is required to view your
playlists and subscriptions, and
"https://www.googleapis.com/auth/youtube.force-ssl" is required to retrieve
comments.
