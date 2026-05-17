import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { usePlayer } from '../context/PlayerContext';
import { colors, spacing, fontSizes, radii } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export const MINI_PLAYER_HEIGHT = 68;

export default function MiniPlayer() {
  const { isActive, videos, videoIndex, playing, setPlaying, goNext, goPrev } = usePlayer();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  if (!isActive) return null;

  const current = videos[videoIndex];
  if (!current) return null;

  const hasPrev = videoIndex > 0;
  const hasNext = videoIndex < videos.length - 1;

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.infoArea}
        onPress={() => navigation.navigate('Player')}
        android_ripple={{ color: colors.surfaceHighlight }}
      >
        <Image source={{ uri: current.thumbnail }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
          <Text style={styles.channel} numberOfLines={1}>{current.channelTitle}</Text>
        </View>
      </Pressable>

      <View style={styles.controls}>
        <Pressable
          onPress={goPrev}
          disabled={!hasPrev}
          hitSlop={10}
          style={styles.controlBtn}
        >
          <Ionicons
            name="play-skip-back"
            size={20}
            color={hasPrev ? colors.textPrimary : colors.textMuted}
          />
        </Pressable>

        <Pressable
          onPress={() => setPlaying((p) => !p)}
          hitSlop={10}
          style={styles.controlBtn}
        >
          <Ionicons
            name={playing ? 'pause' : 'play'}
            size={22}
            color={colors.textPrimary}
          />
        </Pressable>

        <Pressable
          onPress={goNext}
          disabled={!hasNext}
          hitSlop={10}
          style={styles.controlBtn}
        >
          <Ionicons
            name="play-skip-forward"
            size={20}
            color={hasNext ? colors.textPrimary : colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: MINI_PLAYER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingRight: spacing.sm,
  },
  infoArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm + 2,
    height: '100%',
  },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceHighlight,
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  channel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  controlBtn: {
    padding: spacing.sm,
  },
});
