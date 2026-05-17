import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  useWindowDimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, radii } from '../theme';
import type { PlayerScreenProps } from '../navigation/types';
import YouTubePlayer from '../components/YouTubePlayer';
import { usePlayer } from '../context/PlayerContext';

export default function PlayerScreen({ navigation }: PlayerScreenProps) {
  const { videos, videoIndex, playing, setPlaying, goNext, goPrev, isActive } = usePlayer();
  const { width } = useWindowDimensions();
  const playerHeight = Math.round((width * 9) / 16);

  const current = videos[videoIndex];
  const hasPrev = videoIndex > 0;
  const hasNext = videoIndex < videos.length - 1;
  const loading = !isActive || videos.length === 0;

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

      {/* ── Player ── */}
      <View style={[styles.playerWrap, { height: playerHeight }]}>
        {loading || !current ? (
          <View style={[styles.placeholder, { height: playerHeight }]}>
            <ActivityIndicator color={colors.accent} size="large" />
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
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
            hitSlop={16}
          >
            <Ionicons name="chevron-down" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
          <View style={styles.topBarEnd} />
        </View>

        <View style={styles.inner}>
          {/* Track info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={2}>
              {current?.title ?? '…'}
            </Text>
            <Text style={styles.trackChannel} numberOfLines={1}>
              {current?.channelTitle ?? ''}
            </Text>
          </View>

          {/* Position counter */}
          <View style={styles.counterRow}>
            <View style={styles.counterPill}>
              <Text style={styles.counterText}>
                {videoIndex + 1}
                <Text style={styles.counterOf}> of </Text>
                {videos.length}
              </Text>
            </View>
          </View>

          {/* Controls row: prev · play/pause · next */}
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

// ── Sub-components ────────────────────────────────────────────────────────────

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
      <Ionicons
        name={icon}
        size={24}
        color={enabled ? colors.textPrimary : colors.textMuted}
      />
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
