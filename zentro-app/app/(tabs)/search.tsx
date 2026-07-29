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
// Debounced search against the `events` table (title/location ilike),
// plus local recent-searches and a suggested-category grid for the empty state.

const SUGGESTED_CATEGORIES = ['Music', 'Business', 'Film & Media', 'Travel', 'Education', 'Holiday'];

type EventItem = {
  id: string;
  title: string;
  location: string;
  image_url: string | null;
  price: number;
  is_free?: boolean;
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
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(`title.ilike.%${term}%,location.ilike.%${term}%`)
      .limit(30);
    setLoading(false);
    if (!error && data) setResults(data as EventItem[]);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  function commitSearch(term: string) {
    if (!term.trim()) return;
    setRecent((prev) => [term, ...prev.filter((t) => t !== term)].slice(0, 6));
    runSearch(term);
  }

  function clearRecent() {
    setRecent([]);
  }

  const showEmptyState = query.trim().length === 0;

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={BRAND.textMuted} />
        <TextInput
          style={styles.input}
          placeholder="Search events, venues, categories…"
          placeholderTextColor={BRAND.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => commitSearch(query)}
          returnKeyType="search"
          autoFocus
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={BRAND.textMuted} />
          </Pressable>
        )}
      </View>

      {showEmptyState ? (
        <View style={styles.emptyState}>
          {recent.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <Pressable onPress={clearRecent}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              </View>
              <View style={styles.recentWrap}>
                {recent.map((term) => (
                  <Tappable
                    key={term}
                    style={styles.recentChip}
                    onPress={() => {
                      setQuery(term);
                      commitSearch(term);
                    }}
                  >
                    <Ionicons name="time-outline" size={13} color={BRAND.textMuted} />
                    <Text style={styles.recentChipText}>{term}</Text>
                  </Tappable>
                ))}
              </View>
            </>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
          </View>
          <View style={styles.categoryGrid}>
            {SUGGESTED_CATEGORIES.map((cat) => (
              <Tappable
                key={cat}
                style={styles.categoryCard}
                onPress={() => {
                  setQuery(cat);
                  commitSearch(cat);
                }}
                scaleTo={0.94}
              >
                <Text style={styles.categoryCardText}>{cat}</Text>
              </Tappable>
            ))}
          </View>
        </View>
      ) : loading ? (
        <ActivityIndicator color="#FF6B4A" style={{ marginTop: 40 }} />
      ) : results.length === 0 ? (
        <View style={styles.noResults}>
          <Ionicons name="search-outline" size={32} color={BRAND.textMuted} />
          <Text style={styles.noResultsText}>No events found for "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ResultRow event={item} onPress={() => router.push(`/event/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

function ResultRow({ event, onPress }: { event: EventItem; onPress: () => void }) {
  return (
    <Tappable style={styles.resultRow} onPress={onPress} scaleTo={0.98}>
      {event.image_url ? (
        <Image source={{ uri: event.image_url }} style={styles.resultImage} />
      ) : (
        <View style={styles.resultImagePlaceholder} />
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={BRAND.textMuted} />
          <Text style={styles.resultMeta}>{event.location}</Text>
        </View>
      </View>
      <Text style={styles.resultPrice}>{event.is_free ? 'Free' : `$${event.price.toFixed(2)}`}</Text>
    </Tappable>
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
  container: { flex: 1, backgroundColor: BRAND.background, paddingHorizontal: 20, paddingTop: 60 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 22,
  },
  input: { flex: 1, color: BRAND.textPrimary, fontSize: 14, paddingVertical: 12 },

  emptyState: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '700' },
  clearText: { color: BRAND.accent, fontSize: 12, fontWeight: '600' },

  recentWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.card,
  },
  recentChipText: { color: BRAND.textPrimary, fontSize: 12, fontWeight: '600' },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: {
    width: '47%',
    paddingVertical: 24,
    borderRadius: 16,
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
  },
  categoryCardText: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700' },

  noResults: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: -60 },
  noResultsText: { color: BRAND.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },

  resultsList: { paddingBottom: 40 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: BRAND.card,
    borderRadius: 14,
    padding: 10,
  },
  resultImage: { width: 56, height: 56, borderRadius: 12 },
  resultImagePlaceholder: { width: 56, height: 56, borderRadius: 12, backgroundColor: BRAND.border },
  resultInfo: { flex: 1, marginLeft: 12 },
  resultTitle: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  resultMeta: { color: BRAND.textMuted, fontSize: 12 },
  resultPrice: { color: BRAND.accent, fontSize: 13, fontWeight: '700' },
});