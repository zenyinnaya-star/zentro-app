import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Screen 19 — Ticket Booked (confirmation)
// Presented as a transparent modal (see app/_layout.tsx) so it appears as a
// bottom sheet floating over the Order Detail screen behind it, matching the
// mockup's dimmed-backdrop look. Receives the freshly created ticket's id +
// a few display fields as params from Order Detail so it doesn't need a
// second network round trip.

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
  const { ticketId, eventTitle } = useLocalSearchParams<{
    ticketId: string;
    eventTitle?: string;
    eventImageUrl?: string;
  }>();

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(60)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    Animated.spring(sheetTranslateY, { toValue: 0, delay: 60, friction: 9, tension: 55, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(220),
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 14 }),
    ]).start();
    Animated.timing(contentFade, { toValue: 1, duration: 300, delay: 380, useNativeDriver: true }).start();
    Animated.timing(buttonsFade, { toValue: 1, duration: 300, delay: 480, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale, { toValue: 1.25, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.timing(glowScale, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
        <View style={styles.checkWrap}>
          <Animated.View style={[styles.glowRing, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: contentFade, alignItems: 'center' }}>
          <Text style={styles.title}>Congratulations!</Text>
          <Text style={styles.subtitle}>
            You have successfully placed order for {eventTitle || 'this event'}. Enjoy the event!
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: buttonsFade, width: '100%', gap: 12 }}>
          <Tappable style={styles.primaryButton} onPress={() => router.replace(`/ticket/${ticketId}`)}>
            <Text style={styles.primaryButtonText}>View E-Ticket</Text>
          </Tappable>
          <Tappable style={styles.secondaryButton} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.secondaryButtonText}>Go to Home</Text>
          </Tappable>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const BRAND = {
  accent: '#FF3D8F',
  green: '#34C759',
  textPrimary: '#1A1523',
  textMuted: '#9C98A3',
  border: '#F0EEF1',
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,18,31,0.55)', justifyContent: 'flex-end' },

  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 44,
    alignItems: 'center',
  },

  checkWrap: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  glowRing: { position: 'absolute', width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(52,199,89,0.25)' },
  checkCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: BRAND.green,
    alignItems: 'center', justifyContent: 'center',
  },

  title: { color: BRAND.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: BRAND.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 28, paddingHorizontal: 8 },

  primaryButton: { backgroundColor: BRAND.accent, paddingVertical: 17, borderRadius: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    paddingVertical: 17, borderRadius: 16, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: BRAND.accent,
  },
  secondaryButtonText: { color: BRAND.accent, fontSize: 15, fontWeight: '700' },
});
