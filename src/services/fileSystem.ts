import * as FileSystem from 'expo-file-system';

const AUDIO_EXTENSIONS = ['webm', 'm4a', 'mp3'];

interface LocalFile {
  videoId: string;
  playlistId: string;
  filePath: string;
  fileName: string;
}

function getDir(playlistId?: string): FileSystem.Directory {
  if (playlistId) {
    return new FileSystem.Directory(FileSystem.Paths.document, 'music-player', playlistId);
  }
  return new FileSystem.Directory(FileSystem.Paths.document, 'music-player');
}

function getFile(videoId: string, playlistId: string, ext: string): FileSystem.File {
  return new FileSystem.File(FileSystem.Paths.document, 'music-player', playlistId, `${videoId}.${ext}`);
}

export const fileSystemAPI = {
  async initializeDirectory(playlistId: string): Promise<void> {
    const root = new FileSystem.Directory(FileSystem.Paths.document, 'music-player');
    if (!root.exists) root.create();

    const dir = getDir(playlistId);
    if (!dir.exists) dir.create();
  },

  getFilePath(videoId: string, playlistId: string, ext = 'webm'): string {
    return getFile(videoId, playlistId, ext).uri;
  },

  async findFilePath(videoId: string, playlistId: string): Promise<string | null> {
    for (const ext of AUDIO_EXTENSIONS) {
      const file = getFile(videoId, playlistId, ext);
      if (file.exists) return file.uri;
    }
    return null;
  },

  async fileExists(videoId: string, playlistId: string): Promise<boolean> {
    for (const ext of AUDIO_EXTENSIONS) {
      if (getFile(videoId, playlistId, ext).exists) return true;
    }
    return false;
  },

  async getPlaylistFiles(playlistId: string): Promise<LocalFile[]> {
    const dir = getDir(playlistId);
    if (!dir.exists) return [];

    return dir
      .list()
      .filter((item): item is FileSystem.File => item instanceof FileSystem.File)
      .filter((file) => AUDIO_EXTENSIONS.some((ext) => file.name.endsWith(`.${ext}`)))
      .map((file) => {
        const ext = AUDIO_EXTENSIONS.find((e) => file.name.endsWith(`.${e}`))!;
        return {
          videoId: file.name.slice(0, -(ext.length + 1)),
          playlistId,
          filePath: file.uri,
          fileName: file.name,
        };
      });
  },

  async deleteFile(videoId: string, playlistId: string): Promise<void> {
    for (const ext of AUDIO_EXTENSIONS) {
      const file = getFile(videoId, playlistId, ext);
      if (file.exists) {
        file.delete();
        return;
      }
    }
  },

  async getFileSize(videoId: string, playlistId: string): Promise<number> {
    for (const ext of AUDIO_EXTENSIONS) {
      const file = getFile(videoId, playlistId, ext);
      if (file.exists) return file.size;
    }
    return 0;
  },

  async getDirectorySize(): Promise<number> {
    const root = getDir();
    if (!root.exists) return 0;

    const sum = (dir: FileSystem.Directory): number =>
      dir.list().reduce((total, item) => {
        if (item instanceof FileSystem.File) return total + item.size;
        if (item instanceof FileSystem.Directory) return total + sum(item);
        return total;
      }, 0);

    return sum(root);
  },
};
