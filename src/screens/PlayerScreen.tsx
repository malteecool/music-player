import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  SafeAreaView,
  useWindowDimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { colors, spacing, fontSizes, radii } from '../theme';
import type { PlayerScreenProps } from '../navigation/types';
import YouTubePlayer from '../components/YouTubePlayer';
import { usePlayer } from '../context/PlayerContext';
import { databaseAPI } from '../services/database';

export default function PlayerScreen({ navigation }: PlayerScreenProps) {
  const { videos, videoIndex, playlistId, playing, setPlaying, goNext, goPrev, isActive } = usePlayer();
  const { width } = useWindowDimensions();
  const playerHeight = Math.round((width * 9) / 16);

  const current = videos[videoIndex];
  const hasPrev = videoIndex > 0;
  const hasNext = videoIndex < videos.length - 1;
  const loading = !isActive || videos.length === 0;

  // ── Local file lookup ───────────────────────────────────────────────────────
  const [localFilePath, setLocalFilePath] = useState<string | null>(null);

  useEffect(() => {
    if (!current || !playlistId) { setLocalFilePath(null); return; }
    databaseAPI.getJob(current.id, playlistId).then((job) => {
      setLocalFilePath(job?.status === 'completed' && job.filePath ? job.filePath : null);
    });
  }, [current?.id, playlistId]);

  // ── Local audio playback ────────────────────────────────────────────────────
  const soundRef = useRef<Audio.Sound | null>(null);
  const [soundLoaded, setSoundLoaded] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const sliderDraggingRef = useRef(false);

  // One-time audio mode setup
  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  // Load / unload sound when the local file changes
  useEffect(() => {
    setPositionMillis(0);
    setDurationMillis(0);
    if (!localFilePath) { setSoundLoaded(false); return; }

    let mounted = true;
    let sound: Audio.Sound;

    (async () => {
      const { sound: s } = await Audio.Sound.createAsync(
        { uri: localFilePath },
        { shouldPlay: playing },
      );
      if (!mounted) { s.unloadAsync(); return; }
      sound = s;
      soundRef.current = s;
      s.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (!sliderDraggingRef.current) {
          setPositionMillis(status.positionMillis ?? 0);
          setDurationMillis(status.durationMillis ?? 0);
        }
        if (status.didJustFinish) goNext();
      });
      setSoundLoaded(true);
    })();

    return () => {
      mounted = false;
      setSoundLoaded(false);
      soundRef.current = null;
      sound?.unloadAsync();
    };
  }, [localFilePath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync play / pause to loaded sound
  useEffect(() => {
    if (!soundRef.current || !soundLoaded) return;
    if (playing) soundRef.current.playAsync();
    else soundRef.current.pauseAsync();
  }, [playing, soundLoaded]);

  // ── Seek ────────────────────────────────────────────────────────────────────
  const handleSeek = useCallback(async (ms: number) => {
    if (!soundRef.current || !soundLoaded) return;
    setPositionMillis(ms);
    await soundRef.current.setPositionAsync(ms);
  }, [soundLoaded]);

  // ── YouTube state handler ───────────────────────────────────────────────────
  const handleStateChange = useCallback(
    (state: string) => {
      if (state === 'playing') setPlaying(true);
      else if (state === 'paused') setPlaying(false);
      else if (state === 'ended') setPlaying(false);
    },
    [setPlaying],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Player area ── */}
      <View style={[styles.playerWrap, { height: playerHeight }]}>
        {loading || !current ? (
          <View style={[styles.placeholder, { height: playerHeight }]}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : localFilePath ? (
          <View style={{ width, height: playerHeight }}>
            <Image
              source={{ uri: current.thumbnail }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <View style={styles.localOverlay}>
              <View style={styles.localBadge}>
                <Ionicons name={playing ? 'musical-notes' : 'pause'} size={14} color="#000" />
                <Text style={styles.localBadgeText}>{playing ? 'Playing local' : 'Paused'}</Text>
              </View>
            </View>
          </View>
        ) : (
          <YouTubePlayer
            videoId={current.id}
            width={width}
            height={playerHeight}
            play={playing}
            onStateChange={handleStateChange}
            onEnd={hasNext ? goNext : undefined}
          />
        )}
      </View>

      {/* ── Controls ── */}
      <SafeAreaView style={styles.controls}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn} hitSlop={16}>
            <Ionicons name="chevron-down" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
          <View style={styles.topBarEnd} />
        </View>

        <View style={styles.inner}>
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={2}>{current?.title ?? '…'}</Text>
            <Text style={styles.trackChannel} numberOfLines={1}>{current?.channelTitle ?? ''}</Text>
          </View>

          {localFilePath ? (
            <ProgressBar
              position={positionMillis}
              duration={durationMillis}
              onSeek={handleSeek}
              onDragStart={() => { sliderDraggingRef.current = true; }}
              onDragEnd={() => { sliderDraggingRef.current = false; }}
            />
          ) : (
            <View style={styles.counterRow}>
              <View style={styles.counterPill}>
                <Text style={styles.counterText}>
                  {videoIndex + 1}
                  <Text style={styles.counterOf}> of </Text>
                  {videos.length}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.navRow}>
            <SkipButton icon="play-skip-back" onPress={goPrev} enabled={hasPrev} />
            <PlayPauseButton playing={playing} onPress={() => setPlaying((p) => !p)} />
            <SkipButton icon="play-skip-forward" onPress={goNext} enabled={hasNext} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

type ProgressBarProps = {
  position: number;
  duration: number;
  onSeek: (ms: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

function ProgressBar({ position, duration, onSeek, onDragStart, onDragEnd }: ProgressBarProps) {
  const [dragValue, setDragValue] = useState<number | null>(null);
  const displayMs = dragValue !== null ? dragValue : position;

  return (
    <View style={styles.progressWrap}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration > 0 ? duration : 1}
        value={displayMs}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor="#535353"
        thumbTintColor={colors.accent}
        onSlidingStart={(value) => {
          setDragValue(value);
          onDragStart?.();
        }}
        onValueChange={(value) => setDragValue(value)}
        onSlidingComplete={(value) => {
          setDragValue(null);
          onDragEnd?.();
          onSeek(Math.round(value));
        }}
      />
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(displayMs)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

function PlayPauseButton({ playing, onPress }: { playing: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.playBtn, pressed && styles.playBtnPressed]}
    >
      <Ionicons
        name={playing ? 'pause' : 'play'}
        size={32}
        color="#000"
        style={playing ? undefined : styles.playIconOffset}
      />
    </Pressable>
  );
}

type SkipButtonProps = {
  icon: 'play-skip-back' | 'play-skip-forward';
  onPress: () => void;
  enabled: boolean;
};

function SkipButton({ icon, onPress, enabled }: SkipButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      style={({ pressed }) => [
        styles.skipBtn,
        !enabled && styles.skipBtnDisabled,
        pressed && enabled && styles.skipBtnPressed,
      ]}
    >
      <Ionicons name={icon} size={24} color={enabled ? colors.textPrimary : colors.textMuted} />
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerWrap: {
    backgroundColor: '#000',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  localOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  localBadgeText: {
    color: '#000',
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  controls: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  nowPlayingLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  topBarEnd: {
    width: 40,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  trackInfo: {
    gap: spacing.xs + 2,
  },
  trackTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl + 2,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  trackChannel: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    fontWeight: '400',
  },
  progressWrap: {
    gap: spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
    marginHorizontal: -spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '500',
  },
  counterRow: {
    alignItems: 'center',
  },
  counterPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterText: {
    color: colors.accent,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  counterOf: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl + spacing.sm,
  },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  playBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  playIconOffset: {
    marginLeft: 4,
  },
  skipBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnDisabled: {
    opacity: 0.3,
  },
  skipBtnPressed: {
    backgroundColor: colors.surfaceHighlight,
    borderColor: colors.accent,
  },
});
