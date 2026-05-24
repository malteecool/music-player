# YouTube Playlist to Local MP3 Music Player — Build Plan

## Overview
Replace the YouTube iframe approach with a local MP3 conversion system. Users can add YouTube playlists, convert videos to MP3s stored locally on the Android device, and play them directly from the app. Backend service handles conversion via yt-dlp + ffmpeg.

---

## Architecture

### Backend Service (Node.js)
- Handles YouTube playlist fetching via YouTube API
- Manages yt-dlp + ffmpeg conversion pipeline
- Queues background conversion jobs
- Exposes REST API for Android app
- Hosting: personal machine, NAS, or low-cost cloud VPS

### Android React Native App
- Communicates with backend API
- Manages local MP3 files via `react-native-fs`
- Displays playlist metadata (via YouTube API)
- Plays local MP3 files with audio player (TBD: react-native-sound or similar)

### Storage Strategy
- MP3s stored in Android app's documents/cache directory: `/data/app/musicplayer/documents/playlists/{playlistId}/{songId}.mp3`
- Metadata stored in app database (SQLite via `react-native-sqlite-storage` or similar)
- Organized by playlist ID and song ID for easy lookup

---

## Phase 1: Backend Service Setup
- [ ] Create Node.js express server
- [ ] Install yt-dlp and ffmpeg dependencies
- [ ] Set up YouTube API v3 client for playlist metadata fetching
- [ ] Implement background job queue (Bull, RabbitMQ, or simple queue system)
- [ ] Create API endpoints:
  - `GET /api/playlist/:playlistId` — fetch playlist metadata + video list from YouTube API
  - `POST /api/convert` — queue conversion job for a video
  - `GET /api/status/:jobId` — check conversion job status (queued, converting, completed, failed)
  - `GET /api/files/:playlistId` — return list of converted files ready for download
  - `GET /api/download/:jobId` — download converted MP3 file (binary stream)

## Phase 2: React Native App Integration
- [ ] Install dependencies:
  - `axios` (API client)
  - `react-native-fs` (local file system access)
  - `react-native-sound` or alternative (audio playback)
  - `react-native-sqlite-storage` (metadata caching)
- [ ] Create API client service (`src/services/backend.ts`)
- [ ] Implement file system service for local MP3 management
- [ ] Add database schema for storing conversion job status + file metadata
- [ ] Update playlist screen to show download status per video
- [ ] Add conversion trigger UI (download button per video or batch download)
- [ ] Implement job status polling (check backend periodically)

## Phase 3: UI & Player Integration
- [ ] Update PlaylistScreen to show conversion status for each video
- [ ] Create "Download" button that queues videos for conversion
- [ ] Update PlayerScreen to play local MP3 files instead of YouTube iframe
- [ ] Add progress indicator while conversion is in progress
- [ ] Implement error handling (network errors, conversion failures, storage full)
- [ ] Display which videos are already downloaded vs. still queued

## Phase 4: Polish & Edge Cases
- [ ] Handle large playlists (>100 videos)
- [ ] Manage storage space (show available space, warn when low)
- [ ] Background job retry logic (failed conversions)
- [ ] Batch operations (download all videos in playlist)
- [ ] Offline playback (play downloaded MP3s without internet)
- [ ] Update existing playlists (detect new videos, removed videos)

---

## Step 1 (OLD) — Project Setup
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

---

## File Structure

### Backend (Node.js)
```
backend/
  src/
    api/
      routes/
        playlist.ts      # GET /playlist/:playlistId
        convert.ts       # POST /convert, GET /status/:jobId
        files.ts         # GET /files/:playlistId, GET /download/:jobId
    services/
      youtube.ts        # YouTube API integration
      converter.ts      # yt-dlp + ffmpeg wrapper
      queue.ts          # Job queue management
      storage.ts        # File storage management
    config.ts
    server.ts
  .env
  package.json
```

### React Native App
```
src/
  services/
    youtube.ts         # API calls (DEPRECATED - now backend only)
    storage.ts         # AsyncStorage helpers (local playlists)
    backend.ts         # Backend API client
    fileSystem.ts      # react-native-fs wrapper
    database.ts        # SQLite for job tracking
  screens/
    HomeScreen.tsx
    PlaylistScreen.tsx  # Updated: shows download status
    PlayerScreen.tsx    # Updated: plays local MP3s
    AddPlaylistModal.tsx
  components/
    PlaylistCard.tsx
    VideoRow.tsx        # Updated: shows conversion status
    MusicPlayer.tsx     # Updated: replaces YouTubePlayer
  navigation/
    RootNavigator.tsx
  theme.ts
  types.ts
```

---

## Data Types

### Backend Job Status
```ts
type ConversionJob = {
  id: string;           // unique job ID
  videoId: string;      // YouTube video ID
  playlistId: string;   // playlist this belongs to
  status: 'queued' | 'converting' | 'completed' | 'failed';
  progress: number;     // 0-100
  errorMessage?: string;
  filePath?: string;    // local path when completed
  createdAt: number;
  completedAt?: number;
};

type Video = {
  id: string;           // YouTube video ID
  title: string;
  thumbnail: string;
  duration: string;
  position: number;
  jobId?: string;       // associated conversion job
  jobStatus?: ConversionJob['status'];
};
```

---

## Technical Decisions (TBD/OPEN)
- [ ] Backend hosting solution (personal machine, NAS, cloud VPS?)
- [ ] Audio player library (react-native-sound vs. react-native-audio vs. other)
- [ ] Database (SQLite, Realm, or simple AsyncStorage for metadata)
- [ ] Job queue implementation (Bull with Redis, RabbitMQ, or in-memory for personal use)
- [ ] How to expose backend to Android (local network, ngrok, cloud URL?)

---

## Status

### Phase 1 ✅ COMPLETE
- [x] Backend service ready and tested
- [x] Health endpoint working
- [x] YouTube API integration
- [x] yt-dlp + ffmpeg wrapper ready

### Phase 2 🔄 IN PROGRESS
- [x] Install React Native dependencies (react-native-fs, expo-sqlite, expo-av)
- [x] Create backend API client (`src/services/backend.ts`)
- [x] Create file system service (`src/services/fileSystem.ts`)
- [x] Create database schema (`src/services/database.ts`)
- [x] Create conversion manager (`src/services/conversionManager.ts`)
- [x] Update VideoRow with download status UI
- [x] Update PlaylistScreen with download handler
- [ ] Implement job status polling
- [ ] Create audio player screen

### Phase 3 (TODO)
- [ ] Update PlayerScreen to play local MP3s
- [ ] Add progress indicators
- [ ] Implement error handling

### Phase 4 (TODO)
- [ ] Storage space management
- [ ] Batch operations
- [ ] Playlist update detection

---

## Old Plan (WebView Approach - DEPRECATED)

Note: The previous WebView-based approach has been replaced. See below for reference only.