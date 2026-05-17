import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Video } from '../types';

type PlayerState = {
  playlistId: string | null;
  videoIndex: number;
  playing: boolean;
  videos: Video[];
};

type PlayerContextValue = PlayerState & {
  isActive: boolean;
  startPlayback: (playlistId: string, videoIndex: number, preloadedVideos: Video[]) => void;
  setVideoIndex: (index: number) => void;
  setPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
  goNext: () => void;
  goPrev: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerContextProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>({
    playlistId: null,
    videoIndex: 0,
    playing: false,
    videos: [],
  });

  const startPlayback = useCallback((playlistId: string, videoIndex: number, preloadedVideos: Video[]) => {
    setState({ playlistId, videoIndex, playing: true, videos: preloadedVideos });
  }, []);

  const setVideoIndex = useCallback((index: number) => {
    setState((prev) => ({ ...prev, videoIndex: index }));
  }, []);

  const setPlaying = useCallback((playing: boolean | ((prev: boolean) => boolean)) => {
    setState((prev) => ({
      ...prev,
      playing: typeof playing === 'function' ? playing(prev.playing) : playing,
    }));
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      videoIndex: Math.min(prev.videoIndex + 1, prev.videos.length - 1),
      playing: true,
    }));
  }, []);

  const goPrev = useCallback(() => {
    setState((prev) => ({
      ...prev,
      videoIndex: Math.max(prev.videoIndex - 1, 0),
      playing: true,
    }));
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        isActive: state.playlistId !== null,
        startPlayback,
        setVideoIndex,
        setPlaying,
        goNext,
        goPrev,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerContextProvider');
  return ctx;
}
