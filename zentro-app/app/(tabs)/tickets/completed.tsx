import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import TicketsTabBar from '../../../components/TicketsTabBar';

type Ticket = {
  id: string;
  event_title: string;
  event_image_url: string | null;
  event_location: string;
  event_date: string;
  has_review?: boolean;
};

export default function CompletedTickets() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('tickets')
      .select('id, event_title, event_image_url, event_location, event_date, has_review')
      .eq('status', 'completed')
      .order('event_date', { ascending: false });
    if (data) setTickets(data as Ticket[]);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Tickets</Text>
      <TicketsTabBar />

      {loading ? (
        <ActivityIndicator color={BRAND.accent} style={{ marginTop: 40 }} />
      ) : tickets.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-outline" size={36} color={BRAND.textMuted} />
          <Text style={styles.emptyText}>No completed events yet.</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/ticket/${item.id}`)}>
              {item.event_image_url ? (
                <Image source={{ uri: item.event_image_url }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbPlaceholder} />
              )}
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.event_title}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={12} color={BRAND.textMuted} />
                  <Text style={styles.meta}>{formatDate(item.event_date)}</Text>
                </View>
              </View>
              <Pressable
                style={[styles.reviewButton, item.has_review && styles.reviewButtonDone]}
                onPress={() => router.push(`/review/${item.id}`)}
                disabled={item.has_review}
              >
                <Text style={[styles.reviewButtonText, item.has_review && styles.reviewButtonTextDone]}>
                  {item.has_review ? 'Reviewed' : 'Review'}
                </Text>
              </Pressable>
            </Pressable>
          )}
        />
      )}
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
  textPrimary: '#FFFFFF', textMuted: 'rgba(255,255,255,0.55)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background, paddingHorizontal: 20, paddingTop: 60 },
  header: { color: BRAND.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 80 },
  emptyText: { color: BRAND.textMuted, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.card, borderRadius: 14, padding: 10, marginBottom: 12 },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  thumbPlaceholder: { width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  info: { flex: 1, marginLeft: 12 },
  title: { color: BRAND.textPrimary, fontSize: 13, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  meta: { color: BRAND.textMuted, fontSize: 11 },
  reviewButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: BRAND.accent },
  reviewButtonDone: { backgroundColor: 'rgba(255,255,255,0.08)' },
  reviewButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  reviewButtonTextDone: { color: BRAND.textMuted },
});