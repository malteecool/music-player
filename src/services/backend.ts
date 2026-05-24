import axios from 'axios';
import { Config } from '../config';

const API_BASE_URL = Config.API_URL;

const log = (level: 'INFO' | 'ERROR' | 'WARN', message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [BackendAPI] [${level}] ${message}`;

  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

interface PlaylistMetadata {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  videoCount: number;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  position: number;
}

interface PlaylistResponse {
  metadata: PlaylistMetadata;
  videos: Video[];
}

interface ConversionResponse {
  success: boolean;
  videoId: string;
  playlistId: string;
  filePath?: string;
  error?: string;
}

interface PlaylistFilesResponse {
  playlistId: string;
  files: string[];
  count: number;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const backendAPI = {
  // Playlist endpoints
  async getPlaylist(playlistId: string): Promise<PlaylistResponse> {
    log('INFO', `Fetching playlist metadata`, { playlistId });
    try {
      const response = await apiClient.get<PlaylistResponse>(
        `/playlist/${playlistId}`
      );
      log('INFO', `Playlist fetched successfully`, { videoCount: response.data.metadata.videoCount });
      return response.data;
    } catch (error) {
      log('ERROR', `Failed to fetch playlist`, { playlistId, error });
      throw error;
    }
  },

  async getPlaylistFromUrl(url: string): Promise<PlaylistResponse> {
    log('INFO', `Fetching playlist from URL`, { url });
    try {
      const response = await apiClient.post<PlaylistResponse>('/playlist/from-url', {
        url,
      });
      log('INFO', `Playlist fetched successfully from URL`, { videoCount: response.data.metadata.videoCount });
      return response.data;
    } catch (error) {
      log('ERROR', `Failed to fetch playlist from URL`, { url, error });
      throw error;
    }
  },

  // Conversion endpoints
  async convertVideo(
    videoId: string,
    playlistId: string
  ): Promise<ConversionResponse> {
    log('INFO', `Starting video conversion`, { videoId, playlistId });
    try {
      const response = await apiClient.post<ConversionResponse>('/convert/', {
        videoId,
        playlistId,
      });

      if (response.data.success) {
        log('INFO', `Video conversion successful`, { videoId, filePath: response.data.filePath });
      } else {
        log('ERROR', `Video conversion failed`, { videoId, error: response.data.error });
      }

      return response.data;
    } catch (error) {
      log('ERROR', `Conversion request failed`, { videoId, error });
      throw error;
    }
  },

  async getPlaylistFiles(playlistId: string): Promise<PlaylistFilesResponse> {
    log('INFO', `Fetching playlist files`, { playlistId });
    try {
      const response = await apiClient.get<PlaylistFilesResponse>(
        `/convert/playlist/${playlistId}`
      );
      log('INFO', `Playlist files fetched`, { playlistId, count: response.data.count });
      return response.data;
    } catch (error) {
      log('ERROR', `Failed to fetch playlist files`, { playlistId, error });
      throw error;
    }
  },

  // Download endpoint
  getDownloadUrl(playlistId: string, videoId: string): string {
    const url = `${API_BASE_URL}/download/${playlistId}/${videoId}`;
    log('INFO', `Download URL requested`, { videoId, playlistId, url });
    return url;
  },

  // Health check
  async health(): Promise<{ status: string }> {
    log('INFO', `Health check`);
    try {
      const response = await apiClient.get('/health');
      log('INFO', `Health check passed`, { status: response.data.status });
      return response.data;
    } catch (error) {
      log('ERROR', `Health check failed`, { error });
      throw error;
    }
  },

  // Update base URL (useful for testing or dynamic IPs)
  setBaseUrl(url: string) {
    log('INFO', `Base URL updated`, { url });
    apiClient.defaults.baseURL = url;
  },
};
