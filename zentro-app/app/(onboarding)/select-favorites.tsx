import { View, Text, StyleSheet } from 'react-native';

// Screen 07 — Select Favourite (categories)
export default function SelectFavorites() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Favorites</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
});
