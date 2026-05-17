const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '';

if (__DEV__ && !YOUTUBE_API_KEY) {
  console.warn('EXPO_PUBLIC_YOUTUBE_API_KEY is not set. YouTube API calls will fail.');
}

export const Config = {
  YOUTUBE_API_KEY,
  YOUTUBE_API_BASE_URL: 'https://www.googleapis.com/youtube/v3',
  // After enabling GitHub Pages (Settings → Pages → deploy from /docs on main),
  // replace YOUR_USERNAME with your GitHub username.
  PLAYER_BASE_URL: 'https://YOUR_USERNAME.github.io/music-player/player.html',
} as const;
