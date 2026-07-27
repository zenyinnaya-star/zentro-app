import { View, Text, StyleSheet } from 'react-native';

// Screen 16 — Map View
export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen 16 — Map View</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
});
