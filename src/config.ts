const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';
const ENVIRONMENT = process.env.EXPO_PUBLIC_ENV ?? 'development';

if (__DEV__ && !YOUTUBE_API_KEY) {
  console.warn('EXPO_PUBLIC_YOUTUBE_API_KEY is not set. YouTube API calls will fail.');
}

console.log(`[Config] Environment: ${ENVIRONMENT}`);
console.log(`[Config] Backend API URL: ${API_URL}`);

export const Config = {
  YOUTUBE_API_KEY,
  YOUTUBE_API_BASE_URL: 'https://www.googleapis.com/youtube/v3',
  PLAYER_BASE_URL: 'https://malteecool.github.io/music-player',
  API_URL,
  ENVIRONMENT,
} as const;
