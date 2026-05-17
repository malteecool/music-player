import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, radii } from '../theme';
import { parsePlaylistUrl, fetchPlaylistById } from '../services/youtube';
import { savePlaylist, getPlaylists } from '../services/storage';
import type { Playlist } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdded: (playlist: Playlist) => void;
};

type Phase = 'input' | 'loading' | 'preview' | 'saving';

export default function AddPlaylistModal({ visible, onClose, onAdded }: Props) {
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Playlist | null>(null);
  const [alreadyAdded, setAlreadyAdded] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setUrl('');
      setPhase('input');
      setError(null);
      setPreview(null);
      setAlreadyAdded(false);
    }
  }, [visible]);

  const reset = () => {
    setUrl('');
    setPhase('input');
    setError(null);
    setPreview(null);
    setAlreadyAdded(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePreview = async () => {
    const id = parsePlaylistUrl(url);
    if (!id) {
      setError('Paste a valid YouTube playlist URL or ID.');
      return;
    }
    setError(null);
    setPhase('loading');
    try {
      const [playlist, existing] = await Promise.all([
        fetchPlaylistById(id),
        getPlaylists(),
      ]);
      setAlreadyAdded(existing.some((p) => p.id === playlist.id));
      setPreview(playlist);
      setPhase('preview');
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : 'Could not load playlist. Check the URL and try again.',
      );
      setPhase('input');
    }
  };

  const handleAdd = async () => {
    if (!preview) return;
    setPhase('saving');
    await savePlaylist(preview);
    onAdded(preview);
    reset();
  };

  const isLoading = phase === 'loading' || phase === 'saving';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add Playlist</Text>
              <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              bounces={false}
            >
              <Text style={styles.fieldLabel}>YouTube Playlist URL</Text>
              <View style={styles.inputRow}>
                <Ionicons name="logo-youtube" size={16} color="#FF0000" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={url}
                  onChangeText={(t) => {
                    setUrl(t);
                    setError(null);
                    if (phase === 'preview') {
                      setPreview(null);
                      setPhase('input');
                    }
                  }}
                  placeholder="https://youtube.com/playlist?list=…"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="search"
                  onSubmitEditing={phase === 'input' ? handlePreview : undefined}
                  editable={!isLoading}
                  selectionColor={colors.accent}
                />
                {url.length > 0 && !isLoading && (
                  <Pressable
                    onPress={() => {
                      setUrl('');
                      setError(null);
                      setPreview(null);
                      setPhase('input');
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={17} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>

              {error != null && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {phase === 'loading' && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.accent} size="small" />
                  <Text style={styles.loadingText}>Fetching playlist…</Text>
                </View>
              )}

              {phase === 'preview' && preview != null && (
                <View style={styles.previewCard}>
                  <Image
                    source={{ uri: preview.thumbnail }}
                    style={styles.previewThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewTitle} numberOfLines={2}>
                      {preview.title}
                    </Text>
                    <Text style={styles.previewChannel} numberOfLines={1}>
                      {preview.channelTitle}
                    </Text>
                    <View style={styles.previewBadge}>
                      <View style={styles.previewBadgeDot} />
                      <Text style={styles.previewBadgeText}>{preview.videoCount} videos</Text>
                    </View>
                    {alreadyAdded && (
                      <View style={styles.alreadyBadge}>
                        <Ionicons name="checkmark-circle" size={11} color={colors.accent} />
                        <Text style={styles.alreadyBadgeText}>Already in library</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.actions}>
                {preview == null ? (
                  <Pressable
                    style={[
                      styles.btn,
                      styles.btnPrimary,
                      (!url.trim() || isLoading) && styles.btnDisabled,
                    ]}
                    onPress={handlePreview}
                    disabled={!url.trim() || isLoading}
                  >
                    <Text style={styles.btnPrimaryText}>
                      {phase === 'loading' ? 'Loading…' : 'Preview'}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[
                      styles.btn,
                      styles.btnPrimary,
                      (isLoading || alreadyAdded) && styles.btnDisabled,
                    ]}
                    onPress={handleAdd}
                    disabled={isLoading || alreadyAdded}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : alreadyAdded ? (
                      <>
                        <Ionicons name="checkmark" size={16} color="#000" style={{ marginRight: 6 }} />
                        <Text style={styles.btnPrimaryText}>Already in Library</Text>
                      </>
                    ) : (
                      <Text style={styles.btnPrimaryText}>Add to Library</Text>
                    )}
                  </Pressable>
                )}
                <Pressable style={[styles.btn, styles.btnSecondary]} onPress={handleClose}>
                  <Text style={styles.btnSecondaryText}>Cancel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  kav: {},
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg + 6,
    borderTopRightRadius: radii.lg + 6,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.xl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.md + 2,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    paddingVertical: spacing.md - 1,
    letterSpacing: -0.1,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSizes.xs,
    flex: 1,
    lineHeight: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewThumb: {
    width: 110,
    height: 70,
  },
  previewInfo: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  previewTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    lineHeight: 17,
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  previewChannel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    marginBottom: 5,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  previewBadgeText: {
    color: colors.accent,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  alreadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 5,
  },
  alreadyBadgeText: {
    color: colors.accent,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  btn: {
    borderRadius: radii.full,
    paddingVertical: spacing.md - 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnPrimaryText: {
    color: '#000',
    fontSize: fontSizes.md,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  btnDisabled: {
    opacity: 0.38,
  },
  btnSecondary: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
