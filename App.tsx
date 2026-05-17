import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { PlayerContextProvider } from './src/context/PlayerContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <PlayerContextProvider>
        <RootNavigator />
      </PlayerContextProvider>
    </GestureHandlerRootView>
  );
}
