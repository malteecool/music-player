export type Playlist = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  videoCount: number;
  addedAt: number;
};

export type Video = {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
  position: number;
};
