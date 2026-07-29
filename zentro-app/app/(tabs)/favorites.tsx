import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

// Screen 21 — Favourite
// Expects a `favorites` table: user_id, event_id (foreign key to events).
// Query below joins favorites -> events to pull full event details in one call.

type FavoritedEvent = {
  id: string; // favorite row id
  event: {
    id: string;
    title: string;
    location: string;
    date: string;
    image_url: string | null;
    price: number;
    is_free?: boolean;
  };
};

export default function Favorites() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoritedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id, event:events(id, title, location, date, image_url, price, is_free)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setFavorites(data as unknown as FavoritedEvent[]);
    setLoading(false);
  }, []);

  // Refetch every time this tab regains focus, so unfavoriting elsewhere stays in sync
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  async function removeFavorite(favoriteId: string) {
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId)); // optimistic
    await supabase.from('favorites').delete().eq('id', favoriteId);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BRAND.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Favourites</Text>

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={40} color={BRAND.textMuted} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any event to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/event/${item.event.id}`)}
            >
              {item.event.image_url ? (
                <Image source={{ uri: item.event.image_url }} style={styles.rowImage} />
              ) : (
                <View style={styles.rowImagePlaceholder} />
              )}
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.event.title}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={12} color={BRAND.textMuted} />
                  <Text style={styles.rowMeta}>{item.event.location}</Text>
                </View>
                <Text style={styles.rowPrice}>
                  {item.event.is_free ? 'Free' : `$${item.event.price.toFixed(2)}`}
                </Text>
              </View>
              <Pressable
                style={styles.removeButton}
                onPress={() => removeFavorite(item.id)}
                hitSlop={10}
              >
                <Ionicons name="heart" size={20} color={BRAND.accent} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const BRAND = {
  background: '#14121F',
  card: 'rgba(255,255,255,0.05)',
  accent: '#FF6B4A',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background, paddingHorizontal: 20, paddingTop: 60 },
  loadingContainer: { flex: 1, backgroundColor: BRAND.background, alignItems: 'center', justifyContent: 'center' },
  header: { color: BRAND.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 20 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: -60 },
  emptyTitle: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '700' },
  emptySubtitle: { color: BRAND.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },

  list: { paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BRAND.card, borderRadius: 14, padding: 10, marginBottom: 12,
  },
  rowImage: { width: 60, height: 60, borderRadius: 12 },
  rowImagePlaceholder: { width: 60, height: 60, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowTitle: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  rowMeta: { color: BRAND.textMuted, fontSize: 12 },
  rowPrice: { color: BRAND.accent, fontSize: 13, fontWeight: '700', marginTop: 4 },
  removeButton: { paddingLeft: 8 },
});