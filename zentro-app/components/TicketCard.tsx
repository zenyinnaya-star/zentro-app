import { useEffect, useRef } from 'react';
import { Animated, View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type BadgeVariant = 'pink' | 'green';

type Props = {
  index?: number;
  image: string | null;
  title: string;
  location: string;
  badgeLabel: string;
  badgeVariant: BadgeVariant;
  onPress?: () => void;
  footer: React.ReactNode;
  dimmed?: boolean;
};

export default function TicketCard({
  index = 0,
  image,
  title,
  location,
  badgeLabel,
  badgeVariant,
  onPress,
  footer,
  dimmed,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 70,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
      <Pressable
        style={({ pressed }) => [styles.top, pressed && onPress && styles.pressed]}
        onPress={onPress}
        disabled={!onPress}
      >
        {image ? (
          <Image source={{ uri: image }} style={[styles.thumb, dimmed && styles.dimmed]} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
        <View style={styles.info}>
          <Text style={[styles.title, dimmed && styles.dimmedText]} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <Ionicons name="location-outline" size={13} color={BRAND.textMuted} />
              <Text style={styles.meta} numberOfLines={1}>
                {location}
              </Text>
            </View>
            <View style={[styles.badge, badgeVariant === 'green' ? styles.badgeGreen : styles.badgePink]}>
              <Text
                style={[
                  styles.badgeText,
                  badgeVariant === 'green' ? styles.badgeTextGreen : styles.badgeTextPink,
                ]}
              >
                {badgeLabel}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
      <View style={styles.footer}>{footer}</View>
    </Animated.View>
  );
}

const BRAND = {
  accent: '#FF3D8F',
  accentSoft: 'rgba(255,61,143,0.12)',
  green: '#2FAE60',
  greenSoft: 'rgba(47,174,96,0.12)',
  textPrimary: '#1A1523',
  textMuted: '#9C98A3',
  border: '#F0EEF1',
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 12,
    marginBottom: 14,
    shadowColor: '#1A1523',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  top: { flexDirection: 'row' },
  pressed: { opacity: 0.85 },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  thumbPlaceholder: { backgroundColor: '#F0EEF1' },
  dimmed: { opacity: 0.5 },
  info: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  title: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  dimmedText: { color: BRAND.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, marginRight: 8 },
  meta: { color: BRAND.textMuted, fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgePink: { backgroundColor: BRAND.accentSoft },
  badgeGreen: { backgroundColor: BRAND.greenSoft },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextPink: { color: BRAND.accent },
  badgeTextGreen: { color: BRAND.green },
  footer: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
