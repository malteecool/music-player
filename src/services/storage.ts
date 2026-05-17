import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Playlist, Video } from '../types';

const PLAYLISTS_KEY = '@ytplayer:playlists';
const videosKey = (playlistId: string) => `@ytplayer:videos:${playlistId}`;

export async function getPlaylists(): Promise<Playlist[]> {
  const raw = await AsyncStorage.getItem(PLAYLISTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const playlists = await getPlaylists();
  const exists = playlists.some((p) => p.id === playlist.id);
  if (!exists) {
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify([...playlists, playlist]));
  }
}

export async function deletePlaylist(id: string): Promise<void> {
  const playlists = await getPlaylists();
  await AsyncStorage.setItem(
    PLAYLISTS_KEY,
    JSON.stringify(playlists.filter((p) => p.id !== id)),
  );
  await AsyncStorage.removeItem(videosKey(id));
}

export async function getVideos(playlistId: string): Promise<Video[]> {
  const raw = await AsyncStorage.getItem(videosKey(playlistId));
  return raw ? JSON.parse(raw) : [];
}

export async function saveVideos(playlistId: string, videos: Video[]): Promise<void> {
  await AsyncStorage.setItem(videosKey(playlistId), JSON.stringify(videos));
}
