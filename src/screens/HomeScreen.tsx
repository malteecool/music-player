import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, radii } from '../theme';
import type { HomeScreenProps } from '../navigation/types';
import type { Playlist } from '../types';
import PlaylistCard from '../components/PlaylistCard';
import AddPlaylistModal from './AddPlaylistModal';
import { getPlaylists, deletePlaylist } from '../services/storage';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const fabScale = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      getPlaylists().then((data) => {
        setPlaylists(data);
        Animated.spring(fabScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 6,
        }).start();
      });
      return () => { fabScale.setValue(0); };
    }, [fabScale]),
  );

  const confirmDelete = (playlist: Playlist) => {
    Alert.alert(
      'Remove from library',
      `"${playlist.title}" will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(playlist.id);
            setPlaylists((prev) => prev.filter((p) => p.id !== playlist.id));
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerEyebrow}>Your</Text>
            <Text style={styles.headerTitle}>Library</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconRing}>
              <Ionicons name="musical-notes" size={36} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>
              Tap the{' '}
              <Text style={styles.emptyAccent}>+</Text>
              {' '}button to add a YouTube playlist
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PlaylistCard
            playlist={item}
            onPress={() => navigation.navigate('Playlist', { playlistId: item.id })}
            onLongPress={() => confirmDelete(item)}
          />
        )}
      />

      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
        <Pressable
          onPress={() => setShowAdd(true)}
          style={styles.fabInner}
          android_ripple={{ color: 'rgba(0,0,0,0.22)', borderless: true }}
        >
          <Ionicons name="add" size={30} color="#000" />
        </Pressable>
      </Animated.View>

      <AddPlaylistModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={(playlist) => {
          setPlaylists((prev) => [...prev, playlist]);
          setShowAdd(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  columnWrapper: {
    gap: spacing.md,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerEyebrow: {
    color: colors.accent,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.xxl + 6,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 36,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIconRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAccent: {
    color: colors.accent,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl + 4,
    right: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    elevation: 10,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  fabInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
