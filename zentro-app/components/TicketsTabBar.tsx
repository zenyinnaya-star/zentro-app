import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const TABS = [
  { label: 'Upcoming', path: '/(tabs)/tickets/upcoming' },
  { label: 'Completed', path: '/(tabs)/tickets/completed' },
  { label: 'Cancelled', path: '/(tabs)/tickets/cancelled' },
] as const;

export default function TicketsTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const activeIndex = Math.max(
    0,
    TABS.findIndex((tab) => pathname.endsWith(tab.path.split('/').pop()!))
  );
  const tabWidth = containerWidth ? (containerWidth - 8) / TABS.length : 0;

  useEffect(() => {
    if (!containerWidth) return;
    Animated.spring(translateX, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  }, [activeIndex, containerWidth]);

  const onLayout = (e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.container} onLayout={onLayout}>
      {containerWidth > 0 && (
        <Animated.View style={[styles.pill, { width: tabWidth, transform: [{ translateX }] }]} />
      )}
      {TABS.map((tab, i) => {
        const active = i === activeIndex;
        return (
          <Pressable key={tab.path} style={styles.tab} onPress={() => router.replace(tab.path as any)}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const BRAND = { pillBg: '#F3F1F5', accent: '#FF3D8F', textPrimary: '#1A1523' };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: BRAND.pillBg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  pill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: BRAND.accent,
    borderRadius: 10,
  },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  tabText: { color: BRAND.textPrimary, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
});
