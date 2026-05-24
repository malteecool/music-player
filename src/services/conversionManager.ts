import { fetchAndSaveAudio } from './youtubeAudioClient';
import { databaseAPI } from './database';

export type ConversionStatus = 'queued' | 'converting' | 'completed' | 'failed';

const activeDownloads = new Set<string>();

function getKey(videoId: string, playlistId: string): string {
  return `${playlistId}:${videoId}`;
}

export async function startConversion(
  videoId: string,
  playlistId: string,
  title: string,
  onStatusChange: (status: ConversionStatus, error?: string) => void
): Promise<void> {
  const key = getKey(videoId, playlistId);
  if (activeDownloads.has(key)) return;
  activeDownloads.add(key);

  try {
    console.log("queing job")
    await databaseAPI.upsertJob({
      videoId,
      playlistId,
      title,
      status: 'queued',
      createdAt: Date.now(),
    });
    onStatusChange('queued');

    await databaseAPI.updateJobStatus(videoId, playlistId, 'converting');
    onStatusChange('converting');

    const { filePath } = await fetchAndSaveAudio(videoId, playlistId);

    await databaseAPI.updateJobStatus(videoId, playlistId, 'completed', filePath);
    onStatusChange('completed');
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Download failed';
    await databaseAPI.updateJobStatus(videoId, playlistId, 'failed', undefined, msg);
    console.log(msg)
    onStatusChange('failed', msg);
  } finally {
    activeDownloads.delete(key);
  }
}

export function stopConversion(videoId: string, playlistId: string): void {
  activeDownloads.delete(getKey(videoId, playlistId));
}

export function isConverting(videoId: string, playlistId: string): boolean {
  return activeDownloads.has(getKey(videoId, playlistId));
}
