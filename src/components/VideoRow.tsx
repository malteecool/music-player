import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, radii } from '../theme';
import type { Video } from '../types';

type DownloadStatus = 'completed' | 'converting' | 'queued' | 'failed' | null;

type Props = {
  video: Video;
  onPress: () => void;
  isActive?: boolean;
  downloadStatus?: DownloadStatus;
  onDownload?: () => void;
};

export const THUMB_W = 112;
export const THUMB_H = 63; // 16:9

export default function VideoRow({ video, onPress, isActive = false, downloadStatus, onDownload }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      android_ripple={{ color: colors.surfaceHighlight }}
    >
      {isActive && <View style={styles.activeBar} />}
      <View style={styles.thumbWrap}>
        <Image
          source={{ uri: video.thumbnail }}
          style={styles.thumb}
          resizeMode="cover"
        />
        <View style={styles.posBadge}>
          <Text style={styles.posText}>{video.position + 1}</Text>
        </View>
        {isActive && <View style={styles.activeThumbOverlay} />}
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.title, isActive && styles.titleActive]}
          numberOfLines={2}
        >
          {video.title}
        </Text>
        <Text style={styles.channel} numberOfLines={1}>
          {video.channelTitle}
          {video.duration ? `  ·  ${video.duration}` : ''}
        </Text>
      </View>
      {isActive && (
        <View style={styles.activePulse}>
          <View style={styles.activePulseDot} />
        </View>
      )}
      <View style={styles.actionButton}>
        {downloadStatus === 'converting' ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : downloadStatus === 'completed' ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
        ) : downloadStatus === 'failed' ? (
          <Pressable onPress={onDownload}>
            <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
          </Pressable>
        ) : (
          <Pressable onPress={onDownload}>
            <Ionicons name="download-outline" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.background,
    position: 'relative',
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.accent,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  thumbWrap: {
    borderRadius: radii.sm,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  thumb: {
    width: THUMB_W,
    height: THUMB_H,
  },
  posBadge: {
    position: 'absolute',
    bottom: 3,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  posText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  activeThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29,185,84,0.18)',
  },
  info: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  titleActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  channel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    letterSpacing: 0.1,
  },
  activePulse: {
    marginLeft: spacing.sm,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(29,185,84,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  actionButton: {
    marginLeft: spacing.sm,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
