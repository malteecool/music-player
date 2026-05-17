# YouTube Playlist Player — Build Plan

## Overview
A Spotify-like Android app built with React Native / Expo that imports YouTube playlists by URL and plays videos in-app via a WebView player.

---

## Step 1 — Project Setup
- Init Expo project with TypeScript template: `npx create-expo-app music-player --template expo-template-blank-typescript`
- Install core dependencies:
  - `@react-navigation/native` + `@react-navigation/bottom-tabs` + `@react-navigation/stack`
  - `react-native-screens`, `react-native-safe-area-context` (navigation deps)
  - `react-native-webview` (YouTube playback)
  - `@react-native-async-storage/async-storage` (local persistence)
  - `axios` (API calls)
- Configure `app.json` with app name, Android package name, and permissions

## Step 2 — Google API Key
- Create a project in Google Cloud Console
- Enable the **YouTube Data API v3**
- Create an API key (restrict to Android app + YouTube Data API)
- Store the key in a `.env` file using `expo-constants` / `dotenv`

## Step 3 — Data Layer
Define TypeScript types:
```ts
type Playlist = {
  id: string;           // YouTube playlist ID
  title: string;
  description: string;
  thumbnail: string;    // URL
  channelTitle: string;
  videoCount: number;
  addedAt: number;      // timestamp
};

type Video = {
  id: string;           // YouTube video ID
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
  position: number;
};
```

Build a storage service (`src/services/storage.ts`):
- `getPlaylists()` — load all saved playlists from AsyncStorage
- `savePlaylist(playlist)` — add a new playlist
- `deletePlaylist(id)` — remove a playlist
- `getVideos(playlistId)` — load cached video list for a playlist
- `saveVideos(playlistId, videos)` — cache video list

Build a YouTube API service (`src/services/youtube.ts`):
- `fetchPlaylistById(playlistId)` — fetch playlist metadata
- `fetchPlaylistVideos(playlistId)` — paginate through all playlist items
- `parsePlaylistUrl(url)` — extract playlist ID from any YouTube URL format

## Step 4 — Navigation Structure
```
RootStack
 └─ MainTabs
     ├─ HomeTab       → HomeScreen
     └─ SearchTab     → (future: browse/search)
 └─ PlaylistScreen    (pushed from HomeScreen)
 └─ PlayerScreen      (pushed from PlaylistScreen, modal style)
```

## Step 5 — Screens

### HomeScreen
- Grid of playlist cards (2 columns)
- Each card: thumbnail, title, video count
- FAB (floating action button) to add a new playlist
- Long press on card → delete option

### AddPlaylistModal (bottom sheet or modal screen)
- Text input for YouTube playlist URL
- Validate URL format, extract playlist ID
- Fetch playlist metadata from YouTube API
- Show preview (title, thumbnail, video count) before confirming
- Save to AsyncStorage on confirm

### PlaylistScreen
- Header: playlist thumbnail, title, channel, video count
- Scrollable list of video rows: thumbnail, title, channel, position number
- Tap a video → opens PlayerScreen

### PlayerScreen (modal, slides up from bottom)
- Full-screen WebView rendering the YouTube IFrame embed for the selected video
- Custom controls bar below (or overlay):
  - Video title + channel
  - Previous / Next track buttons (navigate playlist)
  - Close button
- Auto-advance to next video when current ends (via WebView message injection)

## Step 6 — YouTube IFrame Player (WebView)
- Generate an HTML string that loads the YouTube IFrame API
- Pass `videoId` as a prop; re-render on track change
- Use `postMessage` bridge between WebView and React Native for:
  - Player state changes (playing, paused, ended)
  - Triggering next/previous from the native controls bar
- Handle the `onStateChange` event: when state = `ended` (0), advance to next video

## Step 7 — Styling (Spotify-inspired dark theme)
- Background: `#121212`
- Surface/card: `#1E1E1E`
- Primary accent: `#1DB954` (Spotify green) or a red YouTube-tinted variant
- Typography: white primary, `#B3B3B3` secondary
- Build a `theme.ts` constants file used across all screens

## Step 8 — Polish & Edge Cases
- Loading skeletons while fetching playlist data
- Error states (invalid URL, private playlist, API quota exceeded)
- Empty state on HomeScreen when no playlists saved
- Handle playlists with >50 videos (YouTube API paginates at 50 items — implement `nextPageToken` loop)
- AsyncStorage caching so playlists load instantly on reopen without re-fetching

## Step 9 — Build & Test on Android
- Test on Android emulator (AVD) or physical device via Expo Go
- Verify WebView playback works (some devices block autoplay — may need `allowsInlineMediaPlayback`)
- Create a production build with `eas build --platform android`

---

## File Structure
```
src/
  services/
    youtube.ts       # API calls
    storage.ts       # AsyncStorage helpers
  screens/
    HomeScreen.tsx
    PlaylistScreen.tsx
    PlayerScreen.tsx
    AddPlaylistModal.tsx
  components/
    PlaylistCard.tsx
    VideoRow.tsx
    YouTubePlayer.tsx  # WebView wrapper
  navigation/
    RootNavigator.tsx
  theme.ts
  types.ts
```

---

## Open Questions / Decisions
- **Accent color:** pure Spotify green `#1DB954` or a red/white YouTube-tinted palette?
- **Player layout:** full-screen modal vs. persistent mini-player bar at the bottom (like Spotify)?
- **Offline caching:** cache video metadata only (current plan) or also attempt to cache thumbnails locally?
