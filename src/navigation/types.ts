import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: undefined;
  Playlist: { playlistId: string };
  Player: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
};

// Convenience prop types for each screen
export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  StackScreenProps<RootStackParamList>
>;

export type PlaylistScreenProps = StackScreenProps<RootStackParamList, 'Playlist'>;
export type PlayerScreenProps = StackScreenProps<RootStackParamList, 'Player'>;
