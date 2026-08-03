import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

// Screen 17 — Event Detail
// Expects an `events` table row plus optional description / attendee_count /
// organizer_name / organizer_avatar_url / latitude / longitude columns.

type EventDetails = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  location: string;
  date: string;
  price: number;
  is_free?: boolean;
  attendee_count?: number;
  organizer_name?: string;
  organizer_avatar_url?: string | null;
  latitude?: number;
  longitude?: number;
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

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('events').select('*').eq('id', id).single();
      if (data) setEvent(data as EventDetails);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: favRow } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', id)
          .maybeSingle();
        setFavorited(!!favRow);
      }

      setLoading(false);
    })();
  }, [id]);

  async function toggleFavorite() {
    const nextFavorited = !favorited;
    setFavorited(nextFavorited); // optimistic
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 60, bounciness: 12 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !event) {
      setFavorited(!nextFavorited); // revert, nothing to persist to
      return;
    }

    if (nextFavorited) {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, event_id: event.id });
      if (error) setFavorited(!nextFavorited);
    } else {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', event.id);
      if (error) setFavorited(!nextFavorited);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BRAND.accent} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.notFoundText}>Event not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero image */}
        <View style={styles.heroWrap}>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={styles.hero} />
          ) : (
            <View style={styles.heroPlaceholder} />
          )}

          <View style={styles.heroHeader}>
            <Tappable style={styles.roundButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Tappable>
            <Pressable style={styles.roundButton} onPress={toggleFavorite} hitSlop={8}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons
                  name={favorited ? 'heart' : 'heart-outline'}
                  size={20}
                  color={favorited ? BRAND.accent : '#fff'}
                />
              </Animated.View>
            </Pressable>
          </View>
        </View>

        {/* Overlapping white card */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
            <Text style={styles.price}>
              {event.is_free ? 'Free' : `$${event.price.toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={BRAND.textMuted} />
            <Text style={styles.infoText}>{event.location}</Text>
          </View>

          <View style={[styles.infoRow, styles.dateAttendeesRow]}>
            <View style={styles.infoRowInline}>
              <Ionicons name="calendar-outline" size={14} color={BRAND.textMuted} />
              <Text style={styles.infoText}>{formatDate(event.date)}</Text>
            </View>

            {!!event.attendee_count && (
              <View style={styles.avatarStack}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.avatarDot, { marginLeft: i === 0 ? 0 : -10 }]} />
                ))}
                <View style={styles.avatarCountBadge}>
                  <Text style={styles.avatarCountText}>+{event.attendee_count}</Text>
                </View>
              </View>
            )}
          </View>

          {/* About */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>
            {event.description || 'No description provided yet.'}
          </Text>

          {/* Organizers and Attendees */}
          <Text style={styles.sectionTitle}>Organizers and Attendees</Text>
          <View style={styles.organizerRow}>
            {event.organizer_avatar_url ? (
              <Image source={{ uri: event.organizer_avatar_url }} style={styles.organizerAvatar} />
            ) : (
              <View style={styles.organizerAvatarPlaceholder} />
            )}
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerLabel}>Organizers</Text>
              <Text style={styles.organizerName}>{event.organizer_name || 'Event Host'}</Text>
            </View>
            <Tappable
              style={styles.messageButton}
              onPress={() =>
                // Placeholder: no direct-messaging feature/table exists yet.
                // Swap this for `router.push('/messages/${organizerId}')` once built.
                Alert.alert('Coming soon', 'Messaging organizers isn\u2019t available yet.')
              }
            >
              <Ionicons name="chatbubble-outline" size={16} color={BRAND.accent} />
            </Tappable>
          </View>

          {/* Location preview */}
          <Text style={styles.sectionTitle}>Location</Text>
          <Tappable
            style={styles.mapPreview}
            onPress={() => router.push(`/(tabs)/map?eventId=${event.id}`)}
            scaleTo={0.98}
          >
            <View style={styles.seeLocationPill}>
              <Text style={styles.seeLocationText}>See Location</Text>
            </View>
            <View style={styles.mapPin}>
              <Ionicons name="location" size={18} color="#fff" />
            </View>
          </Tappable>
        </View>
      </ScrollView>

      {/* Fixed bottom bar */}
      <View style={styles.bottomBar}>
        <Tappable
          style={styles.partyGroupButton}
          onPress={() => router.push(`/party-group?eventId=${event.id}`)}
          scaleTo={0.97}
        >
          <Ionicons name="people-outline" size={20} color={BRAND.textPrimary} />
        </Tappable>
        <Tappable
          style={styles.buyButton}
          onPress={() => router.push(`/order/${event.id}`)}
          scaleTo={0.97}
        >
          <Text style={styles.buyButtonText}>Buy Ticket</Text>
        </Tappable>
      </View>
    </View>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso)
      .toLocaleString(undefined, {
        weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
      .toUpperCase();
  } catch {
    return iso;
  }
}

const BRAND = {
  background: '#14121F',
  accent: '#FF3D8F',
  cardBg: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textMuted: 'rgba(0,0,0,0.4)',
  border: 'rgba(0,0,0,0.06)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  loadingContainer: { flex: 1, backgroundColor: BRAND.background, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },

  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 280 },
  heroPlaceholder: { width: '100%', height: 280, backgroundColor: '#222' },
  heroHeader: {
    position: 'absolute', top: 56, left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  roundButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },

  card: {
    backgroundColor: BRAND.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    minHeight: 400,
  },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  title: { flex: 1, color: BRAND.textPrimary, fontSize: 18, fontWeight: '800', lineHeight: 24 },
  price: { color: BRAND.accent, fontSize: 17, fontWeight: '800' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoRowInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateAttendeesRow: { justifyContent: 'space-between', marginTop: 2, marginBottom: 20 },
  infoText: { color: BRAND.textMuted, fontSize: 12.5 },

  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatarDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#ddd', borderWidth: 2, borderColor: '#fff' },
  avatarCountBadge: {
    marginLeft: -10, width: 26, height: 26, borderRadius: 13, backgroundColor: BRAND.accent,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  avatarCountText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  sectionTitle: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 6, marginBottom: 10 },
  description: { color: BRAND.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 22 },

  organizerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 22,
  },
  organizerAvatar: { width: 46, height: 46, borderRadius: 23 },
  organizerAvatarPlaceholder: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#eee' },
  organizerInfo: { flex: 1 },
  organizerLabel: { color: BRAND.textMuted, fontSize: 11 },
  organizerName: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 2 },
  messageButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,61,143,0.12)', alignItems: 'center', justifyContent: 'center',
  },

  mapPreview: {
    height: 130, borderRadius: 18, backgroundColor: '#EEF0F2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden',
  },
  seeLocationPill: {
    position: 'absolute', top: 12, alignSelf: 'center',
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  seeLocationText: { fontSize: 11, fontWeight: '700', color: BRAND.textPrimary },
  mapPin: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: BRAND.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
  },

  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: BRAND.background,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 34,
  },
  partyGroupButton: {
    width: 54, height: 54, borderRadius: 16, backgroundColor: '#F2F2F2',
    alignItems: 'center', justifyContent: 'center',
  },
  buyButton: { flex: 1, backgroundColor: BRAND.accent, paddingVertical: 17, borderRadius: 16, alignItems: 'center' },
  buyButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
