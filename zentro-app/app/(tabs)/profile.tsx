import { View, Text, StyleSheet } from 'react-native';

// Screen 28 — My Profile
export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen 28 — My Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
});
