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
// is_free, attendee_count, tag (e.g. "Dance"), host_name, host_avatar_url
const CATEGORIES = [
  { key: 'Music', emoji: '🎤' },
  { key: 'Education', emoji: '👨‍👩‍👧' },
  { key: 'Film & Media', emoji: '🎞️' },
];

// Placeholder photos — swap for real Supabase `image_url` values once seeded.
const PLACEHOLDER_PHOTOS = [
  'https://picsum.photos/seed/zentro-1/300/300',
  'https://picsum.photos/seed/zentro-2/300/300',
  'https://picsum.photos/seed/zentro-3/300/300',
  'https://picsum.photos/seed/zentro-4/300/300',
  'https://picsum.photos/seed/zentro-5/300/300',
  'https://picsum.photos/seed/zentro-6/300/300',
  'https://picsum.photos/seed/zentro-7/300/300',
];

const MOCK_UPCOMING: EventItem[] = [
  { id: 'mock-u1', title: 'Satellite mega festival – 2023', category: 'Music', image_url: PLACEHOLDER_PHOTOS[0], location: 'New York', date: '2023-05-26T09:00:00', price: 30, attendee_count: 15 },
  { id: 'mock-u2', title: 'Party with friends at night – 2023', category: 'Music', image_url: PLACEHOLDER_PHOTOS[1], location: 'California', date: '2023-06-10T21:00:00', price: 0, is_free: true },
];

const MOCK_POPULAR: EventItem[] = [
  { id: 'mock-p1', title: 'Going to a Rock Concert', category: 'Music', image_url: PLACEHOLDER_PHOTOS[2], location: 'New York', date: '2023-05-26T09:00:00', end_date: '2023-05-27T10:00:00', price: 30, tag: 'Dance', attendee_count: 15, host_name: 'Altanito Salami', host_avatar_url: 'https://i.pravatar.cc/64?img=12' },
  { id: 'mock-p2', title: 'Friday Night Live', category: 'Music', image_url: PLACEHOLDER_PHOTOS[3], location: 'Miami', date: '2023-06-02T20:00:00', end_date: '2023-06-03T02:00:00', price: 0, is_free: true, tag: 'Pop', attendee_count: 8, host_name: 'Dana Cole', host_avatar_url: 'https://i.pravatar.cc/64?img=32' },
];

const MOCK_RECOMMENDED: EventItem[] = [
  { id: 'mock-r1', title: 'Dance party at the top of the town – 2022', category: 'Music', image_url: PLACEHOLDER_PHOTOS[4], location: 'New York', date: '2022-08-01', price: 30 },
  { id: 'mock-r2', title: 'Festival event at kudasan – 2022', category: 'Music', image_url: PLACEHOLDER_PHOTOS[5], location: 'California', date: '2022-08-12', price: 0, is_free: true },
  { id: 'mock-r3', title: 'Party with friends at night – 2022', category: 'Music', image_url: PLACEHOLDER_PHOTOS[6], location: 'Miami', date: '2022-09-01', price: 0, is_free: true },
  { id: 'mock-r4', title: 'Satellite mega festival – 2022', category: 'Music', image_url: PLACEHOLDER_PHOTOS[0], location: 'California', date: '2022-09-20', price: 30 },
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
  host_name?: string;
  host_avatar_url?: string;
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

  const upcomingSlice = events.slice(0, 5);
  const popularSlice = events.slice(5, 8);
  const recommendedSlice = events.slice(8);
  const upcoming = upcomingSlice.length > 0 ? upcomingSlice : MOCK_UPCOMING;
  const popular = popularSlice.length > 0 ? popularSlice : MOCK_POPULAR;
  const recommended = recommendedSlice.length > 0 ? recommendedSlice : MOCK_RECOMMENDED;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.accent} />}
    >
      {/* Location + notifications */}
      <View style={styles.header}>
        <View>
          <Text style={styles.locationLabel}>Location</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={BRAND.accent} />
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
        <Tappable style={styles.filterButton} onPress={() => router.push('/(tabs)/search')}>
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
              <Text style={styles.chipEmoji}>{cat.emoji}</Text>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.key}</Text>
            </Tappable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={BRAND.accent} style={{ marginTop: 40 }} />
      ) : (
        <>
          <SectionHeader title="Upcoming Events" onSeeAll={() => {}} />
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

          <SectionHeader title="Popular Now" onSeeAll={() => {}} />
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

          <SectionHeader title="Recommendations for you" onSeeAll={() => {}} />
          {recommended.map((item) => (
            <RecommendationRow
              key={item.id}
              event={item}
              onPress={() => router.push(`/event/${item.id}`)}
            />
          ))}
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

function UpcomingCard({ event, onPress }: { event: EventItem; onPress: () => void }) {
  return (
    <Tappable style={styles.upcomingCard} onPress={onPress} scaleTo={0.97}>
      {event.image_url ? (
        <Image source={{ uri: event.image_url }} style={styles.upcomingThumb} />
      ) : (
        <View style={styles.upcomingThumbPlaceholder} />
      )}
      <View style={styles.upcomingInfo}>
        <Text style={styles.upcomingTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={BRAND.textMuted} />
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
              size={18}
              color={BRAND.accent}
            />
          </Animated.View>
        </Pressable>

        {event.host_name && (
          <View style={styles.hostRow}>
            {event.host_avatar_url ? (
              <Image source={{ uri: event.host_avatar_url }} style={styles.hostAvatar} />
            ) : (
              <View style={styles.hostAvatarPlaceholder} />
            )}
            <Text style={styles.hostName} numberOfLines={1}>
              {event.host_name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.popularBody}>
        <Text style={styles.popularTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.popularDate}>{formatRange(event.date, event.end_date)}</Text>

        <View style={styles.popularFooter}>
          <View style={styles.avatarStack}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.avatarDot, { marginLeft: i === 0 ? 0 : -8 }]} />
            ))}
            {!!event.attendee_count && (
              <View style={styles.avatarCountBadge}>
                <Text style={styles.avatarCountText}>+{event.attendee_count}</Text>
              </View>
            )}
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceTagText}>{event.is_free ? 'Free' : `$${event.price.toFixed(2)}`}</Text>
          </View>
        </View>
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
        <Text style={styles.recTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={BRAND.textMuted} />
          <Text style={styles.recMeta}>{event.location}</Text>
        </View>
      </View>
      <View style={[styles.priceTag, event.is_free && styles.priceTagFree]}>
        <Text style={styles.priceTagText}>
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
  background: '#FFFFFF',
  card: '#FAFAFC',
  border: '#F0EEF1',
  accent: '#FF383C',
  accentSoft: '#FFF2F7',
  textPrimary: '#25131A',
  textMuted: '#928A8D',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  locationLabel: { color: BRAND.textPrimary, fontSize: 15, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationValue: { color: BRAND.textMuted, fontSize: 16, fontWeight: '500' },
  iconButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: BRAND.card, alignItems: 'center', justifyContent: 'center' },

  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  searchBar: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BRAND.border, borderRadius: 16, paddingHorizontal: 16, justifyContent: 'center' },
  searchInner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  searchPlaceholder: { color: BRAND.textMuted, fontSize: 14 },
  filterButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BRAND.border, alignItems: 'center', justifyContent: 'center' },

  chipsRow: { gap: 10, paddingBottom: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BRAND.border },
  chipActive: { backgroundColor: BRAND.accent, borderColor: BRAND.accent },
  chipEmoji: { fontSize: 16 },
  chipText: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 16 },
  sectionTitle: { color: BRAND.textPrimary, fontSize: 18, fontWeight: '800' },
  seeAll: { color: BRAND.accent, fontSize: 14, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },

  upcomingRow: { gap: 16, paddingRight: 20 },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', width: 300, backgroundColor: BRAND.card, borderRadius: 20, padding: 12, gap: 12 },
  upcomingThumb: { width: 76, height: 76, borderRadius: 14 },
  upcomingThumbPlaceholder: { width: 76, height: 76, borderRadius: 14, backgroundColor: BRAND.border },
  upcomingInfo: { flex: 1, gap: 2 },
  upcomingTitle: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700', lineHeight: 18 },
  upcomingMeta: { color: BRAND.textMuted, fontSize: 12 },
  joinButton: { backgroundColor: BRAND.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-end' },
  joinButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  popularRow: { gap: 16, paddingRight: 20 },
  popularCard: { width: 300, backgroundColor: BRAND.card, borderRadius: 20, overflow: 'hidden' },
  popularImageWrap: { position: 'relative' },
  popularImage: { width: 300, height: 220 },
  popularImagePlaceholder: { width: 300, height: 220, backgroundColor: BRAND.border },
  tagBadge: { position: 'absolute', top: 14, left: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  tagBadgeText: { color: BRAND.textPrimary, fontSize: 12, fontWeight: '700' },
  favoriteButton: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 12, backgroundColor: BRAND.accentSoft, alignItems: 'center', justifyContent: 'center' },
  hostRow: { position: 'absolute', bottom: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  hostAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#fff' },
  hostAvatarPlaceholder: { width: 28, height: 28, borderRadius: 14, backgroundColor: BRAND.border, borderWidth: 1.5, borderColor: '#fff' },
  hostName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  popularBody: { padding: 16 },
  popularTitle: { color: BRAND.textPrimary, fontSize: 16, fontWeight: '800' },
  popularDate: { color: BRAND.textMuted, fontSize: 12, marginTop: 8, letterSpacing: 0.3 },
  popularFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatarDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: BRAND.border, borderWidth: 2, borderColor: '#fff' },
  avatarCountBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: BRAND.accent, alignItems: 'center', justifyContent: 'center', marginLeft: -8, borderWidth: 2, borderColor: '#fff' },
  avatarCountText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  recRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.card, borderRadius: 18, padding: 12, marginBottom: 14, gap: 12 },
  recImage: { width: 80, height: 80, borderRadius: 14 },
  recImagePlaceholder: { width: 80, height: 80, borderRadius: 14, backgroundColor: BRAND.border },
  recInfo: { flex: 1, gap: 2 },
  recTitle: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700', lineHeight: 18 },
  recMeta: { color: BRAND.textMuted, fontSize: 12 },
  priceTag: { backgroundColor: BRAND.accentSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start' },
  priceTagFree: { backgroundColor: BRAND.accentSoft },
  priceTagText: { color: BRAND.accent, fontSize: 13, fontWeight: '700' },
});
