import { View, Text, StyleSheet } from 'react-native';

// Screen 02 — Onboarding carousel
export default function OnboardingCarousel() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onboarding Carousel</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
});
