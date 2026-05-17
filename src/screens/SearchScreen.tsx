import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Search (coming soon)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.textSecondary },
});
