import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('music-player.db');

export interface ConversionJobRecord {
  id?: number;
  videoId: string;
  playlistId: string;
  title: string;
  status: 'queued' | 'converting' | 'completed' | 'failed';
  filePath?: string;
  errorMessage?: string;
  createdAt: number;
  completedAt?: number;
}

export const databaseAPI = {
  // Initialize database
  async initialize(): Promise<void> {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS conversion_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        videoId TEXT NOT NULL,
        playlistId TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        filePath TEXT,
        errorMessage TEXT,
        createdAt INTEGER NOT NULL,
        completedAt INTEGER,
        UNIQUE(videoId, playlistId)
      );

      CREATE INDEX IF NOT EXISTS idx_playlist_status ON conversion_jobs(playlistId, status);
    `);
  },

  // Add or update a conversion job
  async upsertJob(job: ConversionJobRecord): Promise<number> {
    const result = await db.runAsync(
      `INSERT OR REPLACE INTO conversion_jobs
       (videoId, playlistId, title, status, filePath, errorMessage, createdAt, completedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        job.videoId,
        job.playlistId,
        job.title,
        job.status,
        job.filePath || null,
        job.errorMessage || null,
        job.createdAt,
        job.completedAt || null,
      ]
    );
    return result.lastInsertRowId;
  },

  // Get a single job
  async getJob(videoId: string, playlistId: string): Promise<ConversionJobRecord | null> {
    const result = await db.getFirstAsync<ConversionJobRecord>(
      'SELECT * FROM conversion_jobs WHERE videoId = ? AND playlistId = ?',
      [videoId, playlistId]
    );
    return result || null;
  },

  // Get all jobs for a playlist
  async getPlaylistJobs(playlistId: string): Promise<ConversionJobRecord[]> {
    const results = await db.getAllAsync<ConversionJobRecord>(
      'SELECT * FROM conversion_jobs WHERE playlistId = ? ORDER BY createdAt DESC',
      [playlistId]
    );
    return results || [];
  },

  // Get jobs by status
  async getJobsByStatus(
    playlistId: string,
    status: ConversionJobRecord['status']
  ): Promise<ConversionJobRecord[]> {
    const results = await db.getAllAsync<ConversionJobRecord>(
      'SELECT * FROM conversion_jobs WHERE playlistId = ? AND status = ?',
      [playlistId, status]
    );
    return results || [];
  },

  // Update job status
  async updateJobStatus(
    videoId: string,
    playlistId: string,
    status: ConversionJobRecord['status'],
    filePath?: string,
    errorMessage?: string
  ): Promise<void> {
    const completedAt = status === 'completed' ? Date.now() : null;
    await db.runAsync(
      `UPDATE conversion_jobs
       SET status = ?, filePath = ?, errorMessage = ?, completedAt = ?
       WHERE videoId = ? AND playlistId = ?`,
      [
        status,
        filePath || null,
        errorMessage || null,
        completedAt,
        videoId,
        playlistId,
      ]
    );
  },

  // Delete a job
  async deleteJob(videoId: string, playlistId: string): Promise<void> {
    await db.runAsync(
      'DELETE FROM conversion_jobs WHERE videoId = ? AND playlistId = ?',
      [videoId, playlistId]
    );
  },

  // Delete all jobs for a playlist
  async deletePlaylistJobs(playlistId: string): Promise<void> {
    await db.runAsync('DELETE FROM conversion_jobs WHERE playlistId = ?', [playlistId]);
  },

  // Get statistics for a playlist
  async getPlaylistStats(playlistId: string) {
    const result = await db.getFirstAsync<{
      total: number;
      completed: number;
      converting: number;
      failed: number;
      queued: number;
    }>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'converting' THEN 1 ELSE 0 END) as converting,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued
       FROM conversion_jobs WHERE playlistId = ?`,
      [playlistId]
    );
    return result || { total: 0, completed: 0, converting: 0, failed: 0, queued: 0 };
  },
};
