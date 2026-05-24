import * as FileSystem from 'expo-file-system';
import { downloadAsync } from 'expo-file-system/legacy';

const VISITOR_DATA_URL = 'https://www.youtube.com/sw.js_data';
const PLAYER_URL = 'https://www.youtube.com/youtubei/v1/player';

const ANDROID_UA = 'com.google.android.youtube/20.10.38 (Linux; U; ANDROID 11) gzip';
const ANDROID_VR_UA =
    'com.google.android.apps.youtube.vr.oculus/1.60.19 ' +
    '(Linux; U; Android 12L; Quest 3 Build/SQ3A.220605.009.A1) gzip';

interface AudioStream {
    itag: number;
    url: string;
    mimeType: string;
    bitrate: number;
    contentLength?: string;
}

async function fetchVisitorData(): Promise<string> {
    const res = await fetch(VISITOR_DATA_URL, {
        headers: { 'User-Agent': ANDROID_UA, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`sw.js_data request failed (${res.status})`);
    const text = await res.text();
    const json = JSON.parse(text.replace(/^\)\]\}'/, ''));
    const visitorData: string | undefined = json?.[0]?.[2]?.[0]?.[0]?.[13];
    if (!visitorData) throw new Error('Could not extract visitorData from YouTube response.');
    return visitorData;
}

async function fetchAudioStreams(videoId: string, visitorData: string): Promise<AudioStream[]> {
    const res = await fetch(PLAYER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': ANDROID_VR_UA,
            Origin: 'https://www.youtube.com',
        },
        body: JSON.stringify({
            videoId,
            contentCheckOk: true,
            context: {
                client: {
                    clientName: 'ANDROID_VR',
                    clientVersion: '1.60.19',
                    deviceMake: 'Oculus',
                    deviceModel: 'Quest 3',
                    osName: 'Android',
                    osVersion: '12L',
                    platform: 'MOBILE',
                    visitorData,
                    hl: 'en',
                    gl: 'US',
                    utcOffsetMinutes: 0,
                },
            },
        }),
    });
    if (!res.ok) throw new Error(`YouTube player API request failed (${res.status})`);

    const data = await res.json();

    const playability = data?.playabilityStatus;
    if (playability?.status === 'ERROR' || playability?.status === 'UNPLAYABLE') {
        throw new Error(playability.reason ?? 'Video is unavailable or unplayable.');
    }

    const formats: AudioStream[] = data?.streamingData?.adaptiveFormats ?? [];
    return formats.filter((f) => f.mimeType?.startsWith('audio/'));
}

function pickBestAudioStream(streams: AudioStream[]): AudioStream {
    return [...streams].sort((a, b) => b.bitrate - a.bitrate)[0];
}

function extensionForMimeType(mimeType: string): string {
    if (mimeType.startsWith('audio/webm')) return 'webm';
    if (mimeType.startsWith('audio/mp4')) return 'm4a';
    return 'webm';
}

export async function fetchAndSaveAudio(
    videoId: string,
    playlistId: string
): Promise<{ filePath: string; mimeType: string }> {
    const visitorData = await fetchVisitorData();
    const streams = await fetchAudioStreams(videoId, visitorData);

    if (!streams.length) throw new Error('No audio streams available for this video.');

    const best = pickBestAudioStream(streams);
    const ext = extensionForMimeType(best.mimeType);
    console.log('Best stream:', best.mimeType, best.bitrate);

    try {
        const root = new FileSystem.Directory(FileSystem.Paths.document, 'music-player');
        console.log('Root dir exists:', root.exists, root.uri);
        if (!root.exists) root.create();
        console.log('Root dir ready');

        const dir = new FileSystem.Directory(FileSystem.Paths.document, 'music-player', playlistId);
        console.log('Playlist dir exists:', dir.exists, dir.uri);
        if (!dir.exists) dir.create();
        console.log('Playlist dir ready');
    } catch (e) {
        console.error('Directory creation failed:', e);
        throw e;
    }

    const file = new FileSystem.File(FileSystem.Paths.document, 'music-player', playlistId, `${videoId}.${ext}`);
    console.log('Saving to:', file.uri);

    try {
        console.log('Starting download...');
        const result = await downloadAsync(best.url, file.uri);
        console.log('Download result:', result.status, result.uri);
        if (result.status !== 200) {
            throw new Error(`Stream download failed with HTTP status ${result.status}`);
        }
    } catch (e) {
        console.error('Download failed:', e);
        throw e;
    }

    return { filePath: file.uri, mimeType: best.mimeType };
}
