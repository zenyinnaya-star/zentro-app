import { View, Text, StyleSheet } from 'react-native';

// Screen 01 — Splash
export default function Splash() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Splash</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
});
