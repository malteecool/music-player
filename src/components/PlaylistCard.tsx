import { useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { colors, spacing, fontSizes, radii } from '../theme';
import type { Playlist } from '../types';

type Props = {
  playlist: Playlist;
  onPress: () => void;
  onLongPress: () => void;
};

export default function PlaylistCard({ playlist, onPress, onLongPress }: Props) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.md * 3) / 2;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={400}
    >
      <Animated.View style={[styles.card, { width: cardWidth, transform: [{ scale }] }]}>
        <Image
          source={{ uri: playlist.thumbnail }}
          style={[styles.thumb, { width: cardWidth, height: cardWidth }]}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {playlist.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {playlist.channelTitle}
          </Text>
          <View style={styles.countRow}>
            <View style={styles.countDot} />
            <Text style={styles.countText}>{playlist.videoCount} videos</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
  },
  thumb: {},
  info: {
    padding: spacing.sm + 2,
    paddingBottom: spacing.sm + 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    lineHeight: 17,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '400',
    letterSpacing: 0.1,
    marginBottom: 5,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  countDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  countText: {
    color: colors.accent,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
