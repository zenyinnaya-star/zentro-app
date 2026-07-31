import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

// Screen 26 — Cancel Booking
// `id` here is the ticket id.
const REASONS = [
  'Change of plans',
  'Found a better event',
  'Event rescheduled',
  'Booked by mistake',
  'Other',
];

type TicketSummary = {
  id: string;
  event_title: string;
  event_image_url: string | null;
  event_date: string;
  price: number;
  is_free?: boolean;
};

export default function CancelBooking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('tickets')
        .select('id, event_title, event_image_url, event_date, price, is_free')
        .eq('id', id)
        .single();
      if (data) setTicket(data as TicketSummary);
      setLoading(false);
    })();
  }, [id]);

  function confirmCancel() {
    if (!reason) {
      Alert.alert('Select a reason', 'Let us know why you\u2019re cancelling.');
      return;
    }
    Alert.alert(
      'Cancel this booking?',
      'This action cannot be undone. Refunds (if eligible) are processed according to the event\u2019s cancellation policy.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        { text: 'Cancel Booking', style: 'destructive', onPress: performCancel },
      ]
    );
  }

  async function performCancel() {
    if (!ticket) return;
    setSubmitting(true);
    // TODO: for paid tickets, trigger a refund via a Supabase Edge Function
    // that calls Stripe server-side before marking the ticket cancelled.
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'cancelled', cancelled_reason: reason })
      .eq('id', ticket.id);
    setSubmitting(false);

    if (error) {
      Alert.alert('Could not cancel', error.message);
      return;
    }
    router.replace('/(tabs)/tickets/cancelled');
  }

  if (loading || !ticket) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BRAND.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.roundButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={BRAND.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Cancel Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle} numberOfLines={2}>{ticket.event_title}</Text>
          <Text style={styles.eventDate}>{formatDate(ticket.event_date)}</Text>
          <Text style={styles.eventPrice}>
            {ticket.is_free ? 'Free' : `$${ticket.price.toFixed(2)} paid`}
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="alert-circle-outline" size={18} color={BRAND.accent} />
          <Text style={styles.warningText}>
            Cancelling this booking is permanent. Refund eligibility depends on the event's policy.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Reason for cancelling</Text>
        {REASONS.map((r) => {
          const selected = reason === r;
          return (
            <Pressable key={r} style={styles.reasonRow} onPress={() => setReason(r)}>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.reasonText}>{r}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
          onPress={confirmCancel}
          disabled={submitting}
        >
          <Text style={styles.confirmButtonText}>
            {submitting ? 'Cancelling…' : 'Cancel Booking'}
          </Text>
        </Pressable>
        <Pressable style={styles.keepButton} onPress={() => router.back()}>
          <Text style={styles.keepButtonText}>Keep My Booking</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

const BRAND = {
  background: '#14121F', card: 'rgba(255,255,255,0.05)', accent: '#FF3D8F',
  textPrimary: '#FFFFFF', textMuted: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.1)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  loadingContainer: { flex: 1, backgroundColor: BRAND.background, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
  },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: BRAND.textPrimary, fontSize: 17, fontWeight: '700' },

  content: { flex: 1, paddingHorizontal: 20 },
  eventCard: { backgroundColor: BRAND.card, borderRadius: 14, padding: 16, marginBottom: 18 },
  eventTitle: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  eventDate: { color: BRAND.textMuted, fontSize: 12, marginBottom: 4 },
  eventPrice: { color: BRAND.accent, fontSize: 13, fontWeight: '700' },

  warningBox: {
    flexDirection: 'row', gap: 10, backgroundColor: 'rgba(255,61,143,0.1)',
    borderRadius: 12, padding: 14, marginBottom: 24, alignItems: 'flex-start',
  },
  warningText: { flex: 1, color: BRAND.textPrimary, fontSize: 12, lineHeight: 18 },

  sectionTitle: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: BRAND.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: BRAND.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND.accent },
  reasonText: { color: BRAND.textPrimary, fontSize: 13 },

  footer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12, gap: 10 },
  confirmButton: { backgroundColor: BRAND.accent, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  keepButton: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: BRAND.border },
  keepButtonText: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '600' },
});
