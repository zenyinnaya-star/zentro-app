import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Screen 19 — Ticket Booked (confirmation)
// Receives the freshly created ticket's id + a few display fields as params
// from Order Detail so it doesn't need a second network round trip.

function Tappable({
  onPress,
  style,
  children,
}: {
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  function pressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  }
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function TicketBooked() {
  const router = useRouter();
  const { ticketId, eventTitle, eventImageUrl } = useLocalSearchParams<{
    ticketId: string;
    eventTitle?: string;
    eventImageUrl?: string;
  }>();

  const checkScale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 14 }),
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
          <Ionicons name="checkmark" size={44} color="#fff" />
        </Animated.View>

        <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
          <Text style={styles.title}>Ticket Booked!</Text>
          <Text style={styles.subtitle}>
            Your payment was successful. Your ticket is ready — show the QR code at the door.
          </Text>

          {!!eventTitle && (
            <View style={styles.eventCard}>
              {eventImageUrl ? (
                <Image source={{ uri: eventImageUrl }} style={styles.eventImage} />
              ) : (
                <View style={styles.eventImagePlaceholder} />
              )}
              <Text style={styles.eventTitle} numberOfLines={2}>{eventTitle}</Text>
            </View>
          )}
        </Animated.View>
      </View>

      <View style={styles.bottomBar}>
        <Tappable
          style={styles.primaryButton}
          onPress={() => router.replace(`/ticket/${ticketId}`)}
        >
          <Text style={styles.primaryButtonText}>View Ticket</Text>
        </Tappable>
        <Tappable
          style={styles.secondaryButton}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </Tappable>
      </View>
    </View>
  );
}

const BRAND = {
  background: '#14121F',
  card: 'rgba(255,255,255,0.05)',
  accent: '#FF6B4A',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  border: 'rgba(255,255,255,0.1)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  checkCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: BRAND.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: { color: BRAND.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: BRAND.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 28 },

  eventCard: {
    width: '100%', backgroundColor: BRAND.card, borderRadius: 16, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  eventImage: { width: 48, height: 48, borderRadius: 10 },
  eventImagePlaceholder: { width: 48, height: 48, borderRadius: 10, backgroundColor: BRAND.border },
  eventTitle: { flex: 1, color: BRAND.textPrimary, fontSize: 14, fontWeight: '700' },

  bottomBar: { paddingHorizontal: 20, paddingBottom: 34, paddingTop: 10, gap: 12 },
  primaryButton: { backgroundColor: BRAND.accent, paddingVertical: 17, borderRadius: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: { paddingVertical: 17, borderRadius: 16, alignItems: 'center' },
  secondaryButtonText: { color: BRAND.textMuted, fontSize: 14, fontWeight: '600' },
});
