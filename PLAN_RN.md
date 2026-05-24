# YouTube Audio Fetch — React Native Plan

Fetch and store YouTube audio streams directly from a React Native app,
with no backend server required. Uses YouTube's internal player API
by impersonating an ANDROID_VR client (Oculus Quest 3), which bypasses
Proof-of-Origin token and signature cipher requirements as of 2026.

## How it works

```
Given a YouTube video ID
        │
        ▼
1. GET  youtube.com/sw.js_data          → extract visitorData token
        │
        ▼
2. POST youtube.com/youtubei/v1/player  → player response JSON
        │  (ANDROID_VR client context)
        ▼
3. Parse adaptiveFormats[]              → filter audio-only streams
        │  (entries where mimeType starts with "audio/")
        ▼
4. Pick best stream                     → highest bitrate
        │
        ▼
5. Download stream URL to device        → save as local file
```

No CORS issues — React Native fetch runs on the native HTTP layer, not a browser.
No FFmpeg needed — streams are stored as-is (webm/opus or mp4/aac).
No official YouTube API key required.

## Audio format

YouTube delivers audio in two formats:
- `audio/webm` — Opus codec (higher quality, smaller size)
- `audio/mp4` — AAC codec (broad compatibility, `.m4a`)

Both are fully supported for playback on Android. Pick based on preference
or filter by mimeType if one format is preferred.

## Dependencies

| Purpose | Library |
|---------|---------|
| HTTP requests | built-in `fetch` |
| File download + storage | `expo-file-system` |

## Phases

### Phase 1 — YouTube client (JS/TS)
- [ ] `fetchVisitorData()` — GET `sw.js_data`, strip `)]}'` prefix, extract `json[0][2][0][0][13]`
- [ ] `fetchAudioStreams(videoId)` — POST player API, parse `adaptiveFormats[]`
- [ ] `pickBestAudioStream(streams)` — sort by bitrate, return highest

### Phase 2 — File download
- [ ] `downloadAudioStream(url, filename)` — use `expo-file-system` to save to local storage
- [ ] Decide storage location (`FileSystem.documentDirectory` or `cacheDirectory`)

### Phase 3 — Integration
- [ ] Wire fetch + download into a single `fetchAndSaveAudio(videoId)` function
- [ ] Handle errors: video unavailable, no audio streams, download failure

## Key implementation details

### Visitor data fetch
```
GET https://www.youtube.com/sw.js_data
Headers:
  User-Agent: com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip
  Accept: application/json

Response starts with )]}' — strip that prefix before JSON.parse()
Value is at: json[0][2][0][0][13]
```

### Player API call
```
POST https://www.youtube.com/youtubei/v1/player
Headers:
  Content-Type: application/json
  User-Agent: com.google.android.apps.youtube.vr.oculus/1.60.19
              (Linux; U; Android 12L; Quest 3 Build/SQ3A.220605.009.A1) gzip
  Origin: https://www.youtube.com

Body:
{
  "videoId": "<VIDEO_ID>",
  "contentCheckOk": true,
  "context": {
    "client": {
      "clientName": "ANDROID_VR",
      "clientVersion": "1.60.19",
      "deviceMake": "Oculus",
      "deviceModel": "Quest 3",
      "osName": "Android",
      "osVersion": "12L",
      "platform": "MOBILE",
      "visitorData": "<VISITOR_DATA>",
      "hl": "en",
      "gl": "US",
      "utcOffsetMinutes": 0
    }
  }
}
```

### Parsing audio streams
```
response.streamingData.adaptiveFormats[]
  → filter: mimeType.startsWith("audio/")
  → each entry has: itag, url, mimeType, bitrate, contentLength
  → sort by bitrate descending → first entry is best quality
```

### Downloading
```js
await FileSystem.downloadAsync(streamUrl, FileSystem.documentDirectory + filename);
```

## Maintenance note

YouTube periodically changes their internal API. If streams stop resolving:
1. Check if `clientVersion` needs bumping
2. Check if the `sw.js_data` path for `visitorData` has changed
3. Check `adaptiveFormats` field names in the player response
