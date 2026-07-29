import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Animated,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

// Screen 14 — Home Page
// Assumes an `events` table in Supabase with columns:
// id, title, category, image_url, location, date, end_date, price,
// is_free, attendee_count, tag (e.g. "Dance")
const CATEGORIES = [
  { key: 'Music', icon: 'musical-notes-outline' as const },
  { key: 'Education', icon: 'book-outline' as const },
  { key: 'Film & Media', icon: 'film-outline' as const },
];

type EventItem = {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  location: string;
  date: string;
  end_date?: string;
  price: number;
  is_free?: boolean;
  tag?: string;
  attendee_count?: number;
};

/* ---------- Reusable animated press wrapper ---------- */
// Wrap any tappable element in this for a consistent, springy "press" feel.
function Tappable({
  onPress,
  style,
  children,
  scaleTo = 0.95,
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

export default function Home() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [location, setLocation] = useState('Calgary, Alberta');

  const loadEvents = useCallback(async () => {
    let query = supabase.from('events').select('*').order('date', { ascending: true });
    if (activeCategory) query = query.eq('category', activeCategory);
    const { data, error } = await query;
    if (!error && data) setEvents(data as EventItem[]);
  }, [activeCategory]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadEvents();
      setLoading(false);
    })();
  }, [loadEvents]);

  async function onRefresh() {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }

  const upcoming = events.slice(0, 5);
  const popular = events.slice(5, 8);
  const recommended = events.slice(8);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      {/* Location + notifications */}
      <View style={styles.header}>
        <View>
          <Text style={styles.locationLabel}>Location</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={16} color="#FF6B4A" />
            <Text style={styles.locationValue}>{location}</Text>
          </View>
        </View>
        <Tappable style={styles.iconButton} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={20} color={BRAND.textPrimary} />
        </Tappable>
      </View>

      {/* Search + filter */}
      <View style={styles.searchRow}>
        <Tappable style={styles.searchBar} onPress={() => router.push('/(tabs)/search')} scaleTo={0.98}>
          <View style={styles.searchInner}>
            <Ionicons name="search" size={16} color={BRAND.textMuted} />
            <Text style={styles.searchPlaceholder}>Search</Text>
          </View>
        </Tappable>
        <Tappable style={styles.filterButton}>
          <Ionicons name="options-outline" size={18} color={BRAND.textPrimary} />
        </Tappable>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CATEGORIES.map((cat) => {
          const active = cat.key === activeCategory;
          return (
            <Tappable
              key={cat.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveCategory(active ? null : cat.key)}
            >
              <Ionicons name={cat.icon} size={15} color={active ? '#fff' : BRAND.textPrimary} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.key}</Text>
            </Tappable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color="#FF6B4A" style={{ marginTop: 40 }} />
      ) : (
        <>
          <SectionHeader title="Upcoming Events" onSeeAll={() => {}} />
          {upcoming.length === 0 ? (
            <EmptyRow text="No upcoming events yet." />
          ) : (
            <FlatList
              data={upcoming}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.upcomingRow}
              renderItem={({ item }) => (
                <UpcomingCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
              )}
            />
          )}

          <SectionHeader title="Popular Now" onSeeAll={() => {}} />
          {popular.length === 0 ? (
            <EmptyRow text="Nothing trending right now." />
          ) : (
            <FlatList
              data={popular}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.popularRow}
              renderItem={({ item }) => (
                <PopularCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
              )}
            />
          )}

          <SectionHeader title="Recommendations for you" onSeeAll={() => {}} />
          {recommended.length === 0 ? (
            <EmptyRow text="Check back soon for more picks." />
          ) : (
            recommended.map((item) => (
              <RecommendationRow
                key={item.id}
                event={item}
                onPress={() => router.push(`/event/${item.id}`)}
              />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Tappable onPress={onSeeAll}>
        <Text style={styles.seeAll}>See All</Text>
      </Tappable>
    </View>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <View style={styles.emptyRow}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function UpcomingCard({ event, onPress }: { event: EventItem; onPress: () => void }) {
  return (
    <Tappable style={styles.upcomingCard} onPress={onPress} scaleTo={0.97}>
      {event.image_url ? (
        <Image source={{ uri: event.image_url }} style={styles.upcomingThumb} />
      ) : (
        <View style={styles.upcomingThumbPlaceholder} />
      )}
      <View style={styles.upcomingInfo}>
        <Text style={styles.upcomingTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={BRAND.textMuted} />
          <Text style={styles.upcomingMeta}>{event.location}</Text>
        </View>
      </View>
      <Tappable style={styles.joinButton} onPress={onPress}>
        <Text style={styles.joinButtonText}>Join</Text>
      </Tappable>
    </Tappable>
  );
}

function PopularCard({ event, onPress }: { event: EventItem; onPress: () => void }) {
  const [favorited, setFavorited] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  function toggleFavorite() {
    setFavorited((prev) => !prev);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 60, bounciness: 12 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();
  }

  return (
    <Tappable style={styles.popularCard} onPress={onPress} scaleTo={0.97}>
      <View style={styles.popularImageWrap}>
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={styles.popularImage} />
        ) : (
          <View style={styles.popularImagePlaceholder} />
        )}
        {event.tag && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagBadgeText}>{event.tag}</Text>
          </View>
        )}

        <Pressable style={styles.favoriteButton} onPress={toggleFavorite} hitSlop={8}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={16}
              color={favorited ? '#FF6B4A' : '#fff'}
            />
          </Animated.View>
        </Pressable>
      </View>

      <Text style={styles.popularTitle} numberOfLines={1}>
        {event.title}
      </Text>
      <Text style={styles.popularDate}>{formatRange(event.date, event.end_date)}</Text>

      <View style={styles.popularFooter}>
        <View style={styles.avatarStack}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.avatarDot, { marginLeft: i === 0 ? 0 : -8 }]} />
          ))}
          {!!event.attendee_count && <Text style={styles.avatarCount}>+{event.attendee_count}</Text>}
        </View>
        <Text style={styles.popularPrice}>{event.is_free ? 'Free' : `$${event.price.toFixed(2)}`}</Text>
      </View>
    </Tappable>
  );
}

function RecommendationRow({ event, onPress }: { event: EventItem; onPress: () => void }) {
  return (
    <Tappable style={styles.recRow} onPress={onPress} scaleTo={0.98}>
      {event.image_url ? (
        <Image source={{ uri: event.image_url }} style={styles.recImage} />
      ) : (
        <View style={styles.recImagePlaceholder} />
      )}
      <View style={styles.recInfo}>
        <Text style={styles.recTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={BRAND.textMuted} />
          <Text style={styles.recMeta}>{event.location}</Text>
        </View>
      </View>
      <View style={[styles.priceTag, event.is_free && styles.priceTagFree]}>
        <Text style={[styles.priceTagText, event.is_free && styles.priceTagTextFree]}>
          {event.is_free ? 'Free' : `$${event.price.toFixed(2)}`}
        </Text>
      </View>
    </Tappable>
  );
}

function formatRange(startIso: string, endIso?: string) {
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' };
  try {
    const start = new Date(startIso).toLocaleString(undefined, opts);
    if (!endIso) return start.toUpperCase();
    const end = new Date(endIso).toLocaleString(undefined, opts);
    return `${start} – ${end}`.toUpperCase();
  } catch {
    return startIso;
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  locationLabel: { color: BRAND.textMuted, fontSize: 12, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationValue: { color: BRAND.textPrimary, fontSize: 17, fontWeight: '700' },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND.card, alignItems: 'center', justifyContent: 'center' },

  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchBar: { flex: 1, backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border, borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center' },
  searchInner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  searchPlaceholder: { color: BRAND.textMuted, fontSize: 14 },
  filterButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border, alignItems: 'center', justifyContent: 'center' },

  chipsRow: { gap: 10, paddingBottom: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: BRAND.border, backgroundColor: BRAND.card },
  chipActive: { backgroundColor: BRAND.accent, borderColor: BRAND.accent },
  chipText: { color: BRAND.textPrimary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 14 },
  sectionTitle: { color: BRAND.textPrimary, fontSize: 17, fontWeight: '700' },
  seeAll: { color: BRAND.accent, fontSize: 13, fontWeight: '600' },
  emptyRow: { paddingVertical: 20 },
  emptyText: { color: BRAND.textMuted, fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },

  upcomingRow: { gap: 14 },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', width: 280, backgroundColor: BRAND.card, borderRadius: 16, padding: 10, gap: 10 },
  upcomingThumb: { width: 56, height: 56, borderRadius: 12 },
  upcomingThumbPlaceholder: { width: 56, height: 56, borderRadius: 12, backgroundColor: BRAND.border },
  upcomingInfo: { flex: 1 },
  upcomingTitle: { color: BRAND.textPrimary, fontSize: 13, fontWeight: '700' },
  upcomingMeta: { color: BRAND.textMuted, fontSize: 11 },
  joinButton: { backgroundColor: BRAND.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  joinButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  popularRow: { gap: 16 },
  popularCard: { width: 260 },
  popularImageWrap: { position: 'relative', marginBottom: 10 },
  popularImage: { width: 260, height: 170, borderRadius: 18 },
  popularImagePlaceholder: { width: 260, height: 170, borderRadius: 18, backgroundColor: BRAND.card },
  tagBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tagBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  favoriteButton: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  popularTitle: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '700' },
  popularDate: { color: BRAND.textMuted, fontSize: 11, marginTop: 4, letterSpacing: 0.3 },
  popularFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatarDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: BRAND.border, borderWidth: 2, borderColor: BRAND.background },
  avatarCount: { color: BRAND.textMuted, fontSize: 11, marginLeft: 6 },
  popularPrice: { color: BRAND.accent, fontSize: 14, fontWeight: '700' },

  recRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  recImage: { width: 60, height: 60, borderRadius: 12 },
  recImagePlaceholder: { width: 60, height: 60, borderRadius: 12, backgroundColor: BRAND.card },
  recInfo: { flex: 1, marginLeft: 12 },
  recTitle: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700' },
  recMeta: { color: BRAND.textMuted, fontSize: 12 },
  priceTag: { backgroundColor: 'rgba(255,107,74,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  priceTagFree: { backgroundColor: BRAND.card },
  priceTagText: { color: BRAND.accent, fontSize: 12, fontWeight: '700' },
  priceTagTextFree: { color: BRAND.textMuted },
});