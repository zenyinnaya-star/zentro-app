import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Animated, Easing, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../lib/supabase';

// Screen 20 — View Ticket
// Expects a `tickets` table row with a join (or duplicated columns) back to
// the event: event_title, event_image_url, event_location, event_date,
// quantity, holder_name, status ('upcoming' | 'completed' | 'cancelled').
// The mockup's "Seat" and ticket-code fields aren't real persisted concepts
// (this app sells general-admission tickets) — they're derived below purely
// for display, from quantity and the ticket id.

type TicketDetails = {
  id: string;
  event_title: string;
  event_image_url: string | null;
  event_location: string;
  event_date: string;
  quantity: number;
  holder_name: string;
  status: 'upcoming' | 'completed' | 'cancelled';
};

export default function ViewTicket() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;
  const qrScale = useRef(new Animated.Value(0.8)).current;
  const qrOpacity = useRef(new Animated.Value(0)).current;
  const glowX = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('tickets').select('*').eq('id', id).single();
      if (data) setTicket(data as TicketDetails);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (loading || !ticket) return;
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.spring(cardTranslateY, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(160),
      Animated.parallel([
        Animated.timing(qrOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(qrScale, { toValue: 1, speed: 14, bounciness: 8, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.timing(badgeOpacity, { toValue: 1, duration: 300, delay: 420, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowX, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowX, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [loading, ticket]);

  if (loading || !ticket) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BRAND.accent} />
      </View>
    );
  }

  const glowTranslateY = glowX.interpolate({ inputRange: [0, 1], outputRange: [-50, 50] });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.roundButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={BRAND.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>View Ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.passCard, { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }]}>
          <Text style={styles.scanTitle}>Scan This QR</Text>
          <Text style={styles.scanSubtitle}>point this qr to the scan place</Text>

          <Animated.View style={[styles.qrWrap, { opacity: qrOpacity, transform: [{ scale: qrScale }] }]}>
            <View style={styles.qrClip}>
              <QRCode value={ticket.id} size={168} backgroundColor="#F7F6F9" color="#1A1523" />
              <Animated.View
                pointerEvents="none"
                style={[styles.glowBand, { transform: [{ translateY: glowTranslateY }] }]}
              />
            </View>
          </Animated.View>

          {/* Perforation */}
          <View style={styles.perforationRow}>
            <View style={styles.perforationHoleLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.perforationHoleRight} />
          </View>

          <Text style={styles.ticketCode}>{ticketCode(ticket.id)}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{ticket.holder_name}</Text>
            </View>
            <View style={[styles.infoCell, styles.infoCellRight]}>
              <Text style={styles.infoLabel}>Hour</Text>
              <Text style={styles.infoValue}>{formatTime(ticket.event_date)}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(ticket.event_date)}</Text>
            </View>
            <View style={[styles.infoCell, styles.infoCellRight]}>
              <Text style={styles.infoLabel}>Seat</Text>
              <Text style={styles.infoValue}>{seatLabel(ticket.quantity)}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.statusBadge, statusStyles[ticket.status], { opacity: badgeOpacity }]}>
          <Text style={[styles.statusBadgeText, statusTextStyles[ticket.status]]}>{ticket.status.toUpperCase()}</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return iso;
  }
}

// Purely cosmetic: a stable, human-scannable "ticket code" derived from the id.
function ticketCode(id: string) {
  const chars = id.replace(/-/g, '').toUpperCase();
  const groups = [chars.slice(0, 3), chars.slice(3, 5), chars.slice(5, 6), chars.slice(6, 8)].filter(Boolean);
  return groups.join(' ');
}

// Purely cosmetic: this app sells general-admission tickets with no real seat
// map, so seats are synthesized from quantity for display only.
function seatLabel(quantity: number) {
  const seats = Array.from({ length: Math.max(1, quantity) }, (_, i) => `A${i + 1}`);
  return seats.join(', ');
}

const BRAND = {
  background: '#FFFFFF',
  accent: '#FF3D8F',
  textPrimary: '#1A1523',
  textMuted: '#9C98A3',
  border: '#F0EEF1',
};

const statusStyles = StyleSheet.create({
  upcoming: { backgroundColor: 'rgba(255,61,143,0.12)' },
  completed: { backgroundColor: 'rgba(47,174,96,0.12)' },
  cancelled: { backgroundColor: '#F3F1F5' },
});

const statusTextStyles = StyleSheet.create({
  upcoming: { color: BRAND.accent },
  completed: { color: '#2FAE60' },
  cancelled: { color: BRAND.textMuted },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  loadingContainer: { flex: 1, backgroundColor: BRAND.background, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
  },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F1F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: BRAND.textPrimary, fontSize: 17, fontWeight: '800' },

  content: { paddingHorizontal: 20, paddingBottom: 60, alignItems: 'center' },

  passCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 22, padding: 24, alignItems: 'center',
    shadowColor: '#1A1523', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  scanTitle: { color: BRAND.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: 4 },
  scanSubtitle: { color: BRAND.textMuted, fontSize: 12, marginBottom: 20 },

  qrWrap: { alignItems: 'center' },
  qrClip: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#F7F6F9', padding: 12 },
  glowBand: {
    position: 'absolute', top: 79, left: -12, right: -12, height: 34,
    backgroundColor: 'rgba(255,61,143,0.35)',
    shadowColor: BRAND.accent, shadowOpacity: 0.8, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
  },

  perforationRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22, marginHorizontal: -24, width: '100%' },
  perforationHoleLeft: { width: 16, height: 16, borderRadius: 8, backgroundColor: BRAND.background, marginLeft: -8 },
  perforationHoleRight: { width: 16, height: 16, borderRadius: 8, backgroundColor: BRAND.background, marginRight: -8 },
  dashedLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: BRAND.border },

  ticketCode: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '800', letterSpacing: 1, marginBottom: 20 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  infoCell: { width: '50%', marginBottom: 16 },
  infoCellRight: { alignItems: 'flex-end' },
  infoLabel: { color: BRAND.textMuted, fontSize: 11, marginBottom: 4 },
  infoValue: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700' },

  statusBadge: { marginTop: 20, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  statusBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
});
