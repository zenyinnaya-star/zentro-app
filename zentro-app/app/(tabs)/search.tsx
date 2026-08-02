import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

// Screen 15 — Search
// Debounced search against the `events` table (title/location ilike), with an
// optional category filter drawer and a default "nearby" list when the query is empty.

const CATEGORIES = ['Music', 'Business', 'Film & Media', 'Travel', 'Education', 'Holiday'];

type EventItem = {
  id: string;
  title: string;
  location: string;
  date: string;
  image_url: string | null;
  category?: string | null;
};

/* ---------- Reusable animated press wrapper ---------- */
function Tappable({
  onPress,
  style,
  children,
  scaleTo = 0.96,
}: {
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
  scaleTo?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  function pressIn() {
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
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

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [favorited, setFavorited] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (term: string, cat: string | null) => {
    setLoading(true);
    let q = supabase
      .from('events')
      .select('id, title, location, date, image_url, category');

    if (term.trim()) {
      q = q.or(`title.ilike.%${term}%,location.ilike.%${term}%`);
    }
    if (cat) {
      q = q.eq('category', cat);
    }

    const { data, error } = await q.order('date', { ascending: true }).limit(30);
    setLoading(false);
    if (!error && data) setResults(data as EventItem[]);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query, category), query ? 400 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category, runSearch]);

  // Load which of the currently visible results are already favorited.
  useEffect(() => {
    (async () => {
      if (results.length === 0) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('user_id', user.id)
        .in('event_id', results.map((r) => r.id));
      if (data) setFavorited(new Set(data.map((row: any) => row.event_id)));
    })();
  }, [results]);

  async function toggleFavorite(eventId: string) {
    const isFavorited = favorited.has(eventId);
    setFavorited((prev) => {
      const next = new Set(prev);
      isFavorited ? next.delete(eventId) : next.add(eventId);
      return next;
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setFavorited((prev) => {
        const next = new Set(prev);
        isFavorited ? next.add(eventId) : next.delete(eventId);
        return next;
      });
      return;
    }

    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('event_id', eventId);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, event_id: eventId });
    }
  }

  function toggleCategory(cat: string) {
    setCategory((prev) => (prev === cat ? null : cat));
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={BRAND.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Search"
          placeholderTextColor={BRAND.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        <Pressable onPress={() => setShowFilters((v) => !v)} hitSlop={10}>
          <Ionicons
            name="options-outline"
            size={20}
            color={showFilters || category ? BRAND.accent : BRAND.textMuted}
          />
        </Pressable>
      </View>

      {/* My current location shortcut */}
      <Tappable style={styles.locationPill} onPress={() => router.push('/(tabs)/map')} scaleTo={0.98}>
        <Ionicons name="location" size={18} color={BRAND.accent} />
        <Text style={styles.locationText}>My Current Location</Text>
      </Tappable>

      {showFilters && (
        <View style={styles.filterWrap}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <Tappable
                key={cat}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => toggleCategory(cat)}
                scaleTo={0.94}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{cat}</Text>
              </Tappable>
            );
          })}
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={BRAND.accent} style={{ marginTop: 40 }} />
      ) : results.length === 0 ? (
        <View style={styles.noResults}>
          <Ionicons name="search-outline" size={32} color={BRAND.textMuted} />
          <Text style={styles.noResultsText}>
            {query.trim() ? `No events found for "${query}"` : 'No events found.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ResultRow
              event={item}
              favorited={favorited.has(item.id)}
              onPress={() => router.push(`/event/${item.id}`)}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

function ResultRow({
  event,
  favorited,
  onPress,
  onToggleFavorite,
}: {
  event: EventItem;
  favorited: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const heartScale = useRef(new Animated.Value(1)).current;

  function handleToggleFavorite() {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 60, bounciness: 12 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();
    onToggleFavorite();
  }

  return (
    <Tappable style={styles.resultRow} onPress={onPress} scaleTo={0.98}>
      {event.image_url ? (
        <Image source={{ uri: event.image_url }} style={styles.resultImage} />
      ) : (
        <View style={styles.resultImagePlaceholder} />
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.resultMeta}>{formatDate(event.date)}</Text>
      </View>
      <Pressable onPress={handleToggleFavorite} hitSlop={10}>
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={20}
            color={BRAND.accent}
          />
        </Animated.View>
      </Pressable>
    </Tappable>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso)
      .toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      .toUpperCase();
  } catch {
    return iso;
  }
}

const BRAND = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  accent: '#FF3D8F',
  accentSoft: 'rgba(255,61,143,0.1)',
  textPrimary: '#1A1523',
  textMuted: '#9C98A3',
  border: '#F0EEF1',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background, paddingHorizontal: 20, paddingTop: 60 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 14,
    shadowColor: '#1A1523',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  input: { flex: 1, color: BRAND.textPrimary, fontSize: 14, paddingVertical: 14 },

  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND.accentSoft,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 18,
  },
  locationText: { color: BRAND.accent, fontSize: 14, fontWeight: '700' },

  filterWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: BRAND.accent, borderColor: BRAND.accent },
  filterChipText: { color: BRAND.textPrimary, fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },

  noResults: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: -60 },
  noResultsText: { color: BRAND.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },

  resultsList: { paddingBottom: 40 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 10,
    shadowColor: '#1A1523',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  resultImage: { width: 64, height: 64, borderRadius: 12 },
  resultImagePlaceholder: { width: 64, height: 64, borderRadius: 12, backgroundColor: BRAND.border },
  resultInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  resultTitle: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700' },
  resultMeta: { color: BRAND.textMuted, fontSize: 11, fontWeight: '600', marginTop: 6 },
});
