import axios from 'axios';
import { Config } from '../config';
import type { Playlist, Video } from '../types';

const api = axios.create({
  baseURL: Config.YOUTUBE_API_BASE_URL,
  params: { key: Config.YOUTUBE_API_KEY },
});

// Extracts playlist ID from any common YouTube URL format
export function parsePlaylistUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const list = parsed.searchParams.get('list');
    if (list) return list;
  } catch {
    // not a valid URL — try a bare ID
  }
  if (/^[A-Za-z0-9_-]{10,}$/.test(url.trim())) {
    return url.trim();
  }
  return null;
}

function parseApiError(err: unknown): Error {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return new Error('Network error — check your internet connection.');
    }
    const status = err.response.status;
    const reason = err.response.data?.error?.errors?.[0]?.reason as string | undefined;
    if (status === 403) {
      if (reason === 'quotaExceeded') {
        return new Error('YouTube API quota exceeded. Try again tomorrow.');
      }
      return new Error('API key is invalid or restricted.');
    }
    if (status === 400) return new Error('Invalid request — check the playlist URL.');
    if (status === 404) return new Error('Playlist not found.');
  }
  if (err instanceof Error) return err;
  return new Error('An unexpected error occurred.');
}

export async function fetchPlaylistById(playlistId: string): Promise<Playlist> {
  try {
    const { data } = await api.get('/playlists', {
      params: {
        part: 'snippet,contentDetails',
        id: playlistId,
        maxResults: 1,
      },
    });

    if (!data.items?.length) {
      throw new Error('Playlist not found or is private.');
    }

    const item = data.items[0];
    const snippet = item.snippet;
    const thumbnail =
      snippet.thumbnails?.maxres?.url ??
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.default?.url ??
      '';

    return {
      id: item.id,
      title: snippet.title,
      description: snippet.description ?? '',
      thumbnail,
      channelTitle: snippet.channelTitle ?? '',
      videoCount: item.contentDetails?.itemCount ?? 0,
      addedAt: Date.now(),
    };
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function fetchPlaylistVideos(playlistId: string): Promise<Video[]> {
  const videos: Video[] = [];
  let pageToken: string | undefined;
  let position = 0;

  try {
    do {
      const { data } = await api.get('/playlistItems', {
        params: {
          part: 'snippet,contentDetails',
          playlistId,
          maxResults: 50,
          ...(pageToken ? { pageToken } : {}),
        },
      });

      for (const item of data.items ?? []) {
        const snippet = item.snippet;
        if (snippet.title === 'Deleted video' || snippet.title === 'Private video') continue;

        const thumbnail =
          snippet.thumbnails?.high?.url ??
          snippet.thumbnails?.default?.url ??
          '';

        videos.push({
          id: snippet.resourceId.videoId,
          title: snippet.title,
          thumbnail,
          channelTitle: snippet.videoOwnerChannelTitle ?? '',
          position: position++,
        });
      }

      pageToken = data.nextPageToken;
    } while (pageToken);
  } catch (err) {
    throw parseApiError(err);
  }

  return videos;
}
