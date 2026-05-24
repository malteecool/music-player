import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, radii } from '../theme';
import type { PlaylistScreenProps } from '../navigation/types';
import type { Playlist, Video } from '../types';
import VideoRow, { THUMB_W } from '../components/VideoRow';
import { SkeletonBox, SkeletonVideoRow } from '../components/Skeleton';
import { getPlaylists, getVideos, saveVideos } from '../services/storage';
import { fetchPlaylistVideos } from '../services/youtube';
import MiniPlayer from '../components/MiniPlayer';
import { usePlayer } from '../context/PlayerContext';
import { databaseAPI, type ConversionJobRecord } from '../services/database';
import { startConversion, type ConversionStatus } from '../services/conversionManager';

export default function PlaylistScreen({ route, navigation }: PlaylistScreenProps) {
    const { playlistId } = route.params;
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jobMap, setJobMap] = useState<Map<string, ConversionJobRecord>>(new Map());

    const player = usePlayer();
    const activeIndex =
        player.playlistId === playlistId ? player.videoIndex : null;

    // Initialize database and load jobs on mount
    useEffect(() => {
        const init = async () => {
            try {
                await databaseAPI.initialize();
                const jobs = await databaseAPI.getPlaylistJobs(playlistId);
                setJobMap(new Map(jobs.map(job => [job.videoId, job])));
            } catch (e) {
                console.error('Failed to initialize database:', e);
            }
        };
        init();
    }, [playlistId]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const all = await getPlaylists();
                const pl = all.find((p) => p.id === playlistId) ?? null;
                if (!cancelled) {
                    setPlaylist(pl);
                    if (pl) navigation.setOptions({ title: pl.title });
                }

                const cached = await getVideos(playlistId);
                if (cached.length > 0) {
                    if (!cancelled) { setVideos(cached); setLoading(false); }
                    return;
                }

                const fetched = await fetchPlaylistVideos(playlistId);
                await saveVideos(playlistId, fetched);
                if (!cancelled) setVideos(fetched);
            } catch (e: unknown) {
                if (!cancelled)
                    setError(e instanceof Error ? e.message : 'Failed to load videos.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [playlistId, navigation]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setError(null);
        try {
            const fetched = await fetchPlaylistVideos(playlistId);
            await saveVideos(playlistId, fetched);
            setVideos(fetched);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to refresh.');
        } finally {
            setRefreshing(false);
        }
    }, [playlistId]);

    const handleVideoPress = (index: number) => {
        player.startPlayback(playlistId, index, videos);
        navigation.navigate('Player');
    };

    const handleDownload = useCallback((video: Video) => {
        console.log('[PlaylistScreen] Download button pressed', { videoId: video.id, title: video.title });
        startConversion(video.id, playlistId, video.title, (status: ConversionStatus) => {
            console.log('[PlaylistScreen] Conversion status changed', { videoId: video.id, status });
            setJobMap(prev => {
                const updated = new Map(prev);
                const job = updated.get(video.id);
                if (job) {
                    updated.set(video.id, { ...job, status });
                } else {
                    updated.set(video.id, {
                        videoId: video.id,
                        playlistId,
                        title: video.title,
                        status,
                        createdAt: Date.now(),
                    });
                }
                return updated;
            });
        });
    }, [playlistId]);

    // ── Skeleton loading state ──────────────────────────────────────────────────
    if (loading && videos.length === 0) {
        return (
            <View style={styles.container}>
                {playlist != null && <PlaylistHero playlist={playlist} />}
                <View style={styles.skeletonDivider}>
                    <SkeletonBox width={52} height={10} borderRadius={3} />
                    <View style={styles.dividerLine} />
                    <SkeletonBox width={22} height={10} borderRadius={3} />
                </View>
                {Array.from({ length: 7 }).map((_, i) => (
                    <SkeletonVideoRow key={i} />
                ))}
            </View>
        );
    }

    // ── Error state ─────────────────────────────────────────────────────────────
    if (error && videos.length === 0) {
        return (
            <View style={styles.container}>
                {playlist != null && <PlaylistHero playlist={playlist} />}
                <View style={styles.centered}>
                    <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.errorTitle}>Couldn't load tracks</Text>
                    <Text style={styles.errorBody}>{error}</Text>
                    <Pressable onPress={onRefresh} style={styles.retryBtn}>
                        <Ionicons name="refresh" size={15} color="#000" style={{ marginRight: 6 }} />
                        <Text style={styles.retryText}>Try again</Text>
                    </Pressable>
                </View>
                <MiniPlayer />
            </View>
        );
    }

    // ── Loaded ──────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <FlatList
                data={videos}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListHeaderComponent={
                    <>
                        {playlist != null && <PlaylistHero playlist={playlist} />}
                        <View style={styles.dividerRow}>
                            <Text style={styles.dividerLabel}>TRACKS</Text>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerCount}>{videos.length}</Text>
                        </View>
                    </>
                }
                renderItem={({ item, index }) => (
                    <VideoRow
                        video={item}
                        onPress={() => handleVideoPress(index)}
                        isActive={activeIndex === index}
                        downloadStatus={jobMap.get(item.id)?.status ?? null}
                        onDownload={() => handleDownload(item)}
                    />
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.listContent}
            />
            <MiniPlayer />
        </View>
    );
}

function PlaylistHero({ playlist }: { playlist: Playlist }) {
    return (
        <View style={styles.hero}>
            <Image
                source={{ uri: playlist.thumbnail }}
                style={styles.heroThumb}
                resizeMode="cover"
            />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
                <Text style={styles.heroTitle} numberOfLines={2}>
                    {playlist.title}
                </Text>
                <Text style={styles.heroChannel}>{playlist.channelTitle}</Text>
                <View style={styles.heroStats}>
                    <View style={styles.statPill}>
                        <View style={styles.statDot} />
                        <Text style={styles.statText}>{playlist.videoCount} videos</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    hero: {
        height: 230,
    },
    heroThumb: {
        ...StyleSheet.absoluteFillObject,
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(18,18,18,0.55)',
    },
    heroContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.md,
        paddingBottom: spacing.lg,
    },
    heroTitle: {
        color: colors.textPrimary,
        fontSize: fontSizes.xl + 2,
        fontWeight: '900',
        letterSpacing: -0.6,
        lineHeight: 28,
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    heroChannel: {
        color: colors.textSecondary,
        fontSize: fontSizes.sm,
        fontWeight: '500',
        marginBottom: spacing.sm,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    heroStats: {
        flexDirection: 'row',
    },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 4,
        borderRadius: radii.full,
    },
    statDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: colors.accent,
    },
    statText: {
        color: colors.textSecondary,
        fontSize: fontSizes.xs,
        fontWeight: '600',
    },
    // ── Divider (real + skeleton variant) ──
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    skeletonDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    dividerLabel: {
        color: colors.accent,
        fontSize: fontSizes.xs,
        fontWeight: '800',
        letterSpacing: 2,
    },
    dividerLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
    },
    dividerCount: {
        color: colors.textMuted,
        fontSize: fontSizes.xs,
        fontWeight: '600',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginLeft: spacing.md + THUMB_W + spacing.md,
    },
    listContent: {
        paddingBottom: spacing.xl,
    },
    // ── Error state ──
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.sm,
    },
    errorTitle: {
        color: colors.textPrimary,
        fontSize: fontSizes.lg,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginTop: spacing.sm,
    },
    errorBody: {
        color: colors.textSecondary,
        fontSize: fontSizes.sm,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.xs,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 2,
        borderRadius: radii.full,
        marginTop: spacing.sm,
    },
    retryText: {
        color: '#000',
        fontSize: fontSizes.sm,
        fontWeight: '700',
    },
});
