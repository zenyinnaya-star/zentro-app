import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const TABS = [
  { label: 'Upcoming', path: '/(tabs)/tickets/upcoming' },
  { label: 'Completed', path: '/(tabs)/tickets/completed' },
  { label: 'Cancelled', path: '/(tabs)/tickets/cancelled' },
] as const;

export default function TicketsTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = pathname.endsWith(tab.path.split('/').pop()!);
        return (
          <Pressable
            key={tab.path}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => router.replace(tab.path as any)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const BRAND = {
  card: 'rgba(255,255,255,0.05)', accent: '#FF3D8F',
  textPrimary: '#FFFFFF', textMuted: 'rgba(255,255,255,0.55)',
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: BRAND.card, borderRadius: 14,
    padding: 4, marginBottom: 16, gap: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: BRAND.accent },
  tabText: { color: BRAND.textMuted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
});
