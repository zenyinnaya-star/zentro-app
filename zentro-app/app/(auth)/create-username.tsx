import { View, Text, StyleSheet } from 'react-native';

// Screen 11 — Create Username
export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen 11 — Create Username</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
});
