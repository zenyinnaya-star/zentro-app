import { View, Text, StyleSheet } from 'react-native';

// Screen 19 — Ticket Booked
export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen 19 — Ticket Booked</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
});
