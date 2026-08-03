import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../lib/supabase';

// Screen 20 — View Ticket
// Expects a `tickets` table row with a join (or duplicated columns) back to
// the event: event_title, event_image_url, event_location, event_date,
// quantity, holder_name, status ('upcoming' | 'completed' | 'cancelled').

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('tickets').select('*').eq('id', id).single();
      if (data) setTicket(data as TicketDetails);
      setLoading(false);
    })();
  }, [id]);

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
        <Text style={styles.headerTitle}>Your Ticket</Text>
        <Pressable
          style={styles.roundButton}
          onPress={() =>
            Share.share({
              message: `I'm going to ${ticket.event_title}! ${formatDate(ticket.event_date)} @ ${ticket.event_location}`,
            })
          }
        >
          <Ionicons name="share-outline" size={18} color={BRAND.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ticket "pass" card */}
        <View style={styles.passCard}>
          {ticket.event_image_url ? (
            <Image source={{ uri: ticket.event_image_url }} style={styles.passImage} />
          ) : (
            <View style={styles.passImagePlaceholder} />
          )}

          <View style={styles.passBody}>
            <Text style={styles.eventTitle} numberOfLines={2}>{ticket.event_title}</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(ticket.event_date)}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{ticket.event_location}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Holder</Text>
                <Text style={styles.infoValue}>{ticket.holder_name}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Quantity</Text>
                <Text style={styles.infoValue}>{ticket.quantity}</Text>
              </View>
            </View>

            {/* Perforation */}
            <View style={styles.perforationRow}>
              <View style={styles.perforationHoleLeft} />
              <View style={styles.dashedLine} />
              <View style={styles.perforationHoleRight} />
            </View>

            <View style={styles.qrWrap}>
              <QRCode value={ticket.id} size={160} backgroundColor="#fff" color="#000" />
              <Text style={styles.ticketId}>{ticket.id}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.statusBadge, statusStyles[ticket.status]]}>
          <Text style={styles.statusBadgeText}>{ticket.status.toUpperCase()}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const BRAND = {
  background: '#14121F',
  card: 'rgba(255,255,255,0.05)',
  accent: '#FF6B4A',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  border: 'rgba(255,255,255,0.1)',
};

const statusStyles = StyleSheet.create({
  upcoming: { backgroundColor: 'rgba(255,107,74,0.15)' },
  completed: { backgroundColor: 'rgba(46,204,113,0.15)' },
  cancelled: { backgroundColor: 'rgba(255,255,255,0.08)' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  loadingContainer: { flex: 1, backgroundColor: BRAND.background, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
  },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: BRAND.textPrimary, fontSize: 17, fontWeight: '700' },

  content: { paddingHorizontal: 20, paddingBottom: 60, alignItems: 'center' },

  passCard: { width: '100%', backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden' },
  passImage: { width: '100%', height: 140 },
  passImagePlaceholder: { width: '100%', height: 140, backgroundColor: '#e5e5e5' },
  passBody: { padding: 20 },
  eventTitle: { color: '#1A1A1A', fontSize: 17, fontWeight: '800', marginBottom: 16 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  infoCell: { width: '45%' },
  infoLabel: { color: 'rgba(0,0,0,0.4)', fontSize: 11, marginBottom: 3 },
  infoValue: { color: '#1A1A1A', fontSize: 13, fontWeight: '700' },

  perforationRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, marginHorizontal: -20 },
  perforationHoleLeft: { width: 16, height: 16, borderRadius: 8, backgroundColor: BRAND.background, marginLeft: -8 },
  perforationHoleRight: { width: 16, height: 16, borderRadius: 8, backgroundColor: BRAND.background, marginRight: -8 },
  dashedLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)' },

  qrWrap: { alignItems: 'center', gap: 10 },
  ticketId: { color: 'rgba(0,0,0,0.35)', fontSize: 11, letterSpacing: 1 },

  statusBadge: { marginTop: 20, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  statusBadgeText: { color: BRAND.textPrimary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
});
