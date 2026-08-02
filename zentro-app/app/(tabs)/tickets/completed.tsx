import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import TicketsTabBar from '../../../components/TicketsTabBar';
import TicketCard from '../../../components/TicketCard';
import AnimatedButton from '../../../components/AnimatedButton';

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
      <Text style={styles.header}>All Tickets</Text>
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
          renderItem={({ item, index }) => (
            <TicketCard
              index={index}
              image={item.event_image_url}
              title={item.event_title}
              location={item.event_location}
              badgeLabel="Completed"
              badgeVariant="green"
              onPress={() => router.push(`/ticket/${item.id}`)}
              footer={
                <>
                  <AnimatedButton
                    label="View Detail"
                    variant="outline"
                    onPress={() => router.push(`/ticket/${item.id}`)}
                  />
                  <AnimatedButton
                    label={item.has_review ? 'Reviewed' : 'Write a Review'}
                    variant="solid"
                    flex={1.3}
                    disabled={item.has_review}
                    onPress={() => router.push(`/review/${item.id}`)}
                  />
                </>
              }
            />
          )}
        />
      )}
    </View>
  );
}

const BRAND = { background: '#FFFFFF', accent: '#FF3D8F', textPrimary: '#1A1523', textMuted: '#9C98A3' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background, paddingHorizontal: 20, paddingTop: 60 },
  header: { color: BRAND.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 80 },
  emptyText: { color: BRAND.textMuted, fontSize: 13 },
});
