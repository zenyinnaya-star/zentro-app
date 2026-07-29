import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  Image,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

// Screen 16 — Map View
// Uses react-native-maps (Apple Maps / Google Maps) + OSRM public demo (free routing, no key).
// Native module — requires a custom dev client, won't render in plain Expo Go.

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/foot';

type Coord = [number, number]; // [lng, lat] — GeoJSON order

const toLatLng = (c: Coord) => ({ latitude: c[1], longitude: c[0] });

type EventDetails = {
  id: string;
  title: string;
  category: string;
  price: number;
  is_free?: boolean;
  image_url: string | null;
  latitude: number;
  longitude: number;
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

export default function MapScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();

  const [query, setQuery] = useState('');
  const [userCoord, setUserCoord] = useState<Coord | null>(null);
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  // 1. Get the user's live location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied — showing destination only.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoord([pos.coords.longitude, pos.coords.latitude]);
    })();
  }, []);

  // 2. Load the destination event (falls back to first event if no eventId param)
  useEffect(() => {
    (async () => {
      let q = supabase.from('events').select('*').limit(1);
      if (eventId) q = supabase.from('events').select('*').eq('id', eventId).limit(1);
      const { data } = await q;
      if (data && data[0]) setEvent(data[0] as EventDetails);
    })();
  }, [eventId]);

  // 3. Fetch the real walking route from OSRM (free, no key)
  useEffect(() => {
    if (!userCoord || !event) return;

    (async () => {
      try {
        const destCoord: Coord = [event.longitude, event.latitude];
        const url = `${OSRM_BASE}/${userCoord[0]},${userCoord[1]};${destCoord[0]},${destCoord[1]}?overview=full&geometries=geojson`;

        const res = await fetch(url);
        const json = await res.json();

        if (json.code !== 'Ok' || !json.routes?.length) {
          setErrorMsg('Directions unavailable — showing straight line.');
          setRouteCoords([userCoord, destCoord]);
          return;
        }

        const route = json.routes[0];
        setRouteCoords(route.geometry.coordinates as Coord[]);
        setDistance(`${(route.distance / 1000).toFixed(1)} km`);
        setDuration(`${Math.round(route.duration / 60)} min`);

        // Fit camera to the route bounds
        mapRef.current?.fitToCoordinates(
          (route.geometry.coordinates as Coord[]).map(toLatLng),
          {
            edgePadding: { top: 140, right: 60, bottom: 220, left: 60 },
            animated: true,
          }
        );
      } catch {
        setErrorMsg('Could not fetch route.');
        setRouteCoords([userCoord, [event.longitude, event.latitude]]);
      } finally {
        setLoading(false);
      }
    })();
  }, [userCoord, event]);

  const initialCenter = userCoord ?? (event ? ([event.longitude, event.latitude] as Coord) : ([0, 0] as Coord));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          ...toLatLng(initialCenter),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords.map(toLatLng)}
            strokeColor={BRAND.accent}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {userCoord && (
          <Marker coordinate={toLatLng(userCoord)} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userMarker} />
          </Marker>
        )}

        {event && (
          <Marker coordinate={{ latitude: event.latitude, longitude: event.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.destMarker}>
              <Ionicons name="navigate" size={16} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <Tappable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={BRAND.textPrimary} />
        </Tappable>
        <Text style={styles.headerTitle}>Map Direction</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={BRAND.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={BRAND.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading && (
        <View style={styles.loadingPill}>
          <ActivityIndicator size="small" color={BRAND.accent} />
          <Text style={styles.loadingText}>Getting directions…</Text>
        </View>
      )}

      {errorMsg && !loading && (
        <View style={styles.errorPill}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Bottom event card */}
      {event && (
        <Tappable style={styles.eventCard} onPress={() => router.push(`/event/${event.id}`)} scaleTo={0.98}>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={styles.eventImage} />
          ) : (
            <View style={styles.eventImagePlaceholder} />
          )}
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={styles.eventMeta}>
              {event.category} {distance ? `· ${distance}` : ''} {duration ? `· ${duration}` : ''}
            </Text>
            <Text style={styles.eventPrice}>
              {event.is_free ? 'Free' : `$${event.price.toFixed(2)}`}
            </Text>
          </View>
        </Tappable>
      )}
    </View>
  );
}

const BRAND = {
  accent: '#FF3D8F',
  textPrimary: '#1A1A1A',
  textMuted: 'rgba(0,0,0,0.4)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED' },

  header: {
    position: 'absolute', top: 56, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: BRAND.textPrimary },

  searchBar: {
    position: 'absolute', top: 112, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  searchInput: { flex: 1, fontSize: 14, color: BRAND.textPrimary },

  loadingPill: {
    position: 'absolute', top: 170, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  loadingText: { fontSize: 12, color: BRAND.textMuted, fontWeight: '600' },

  errorPill: {
    position: 'absolute', top: 170, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  errorText: { fontSize: 12, color: BRAND.textMuted, textAlign: 'center' },

  userMarker: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#4A90FF', borderWidth: 3, borderColor: '#fff',
  },
  destMarker: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: BRAND.accent,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff',
  },

  eventCard: {
    position: 'absolute', left: 20, right: 20, bottom: 30,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 18, padding: 12, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  eventImage: { width: 64, height: 64, borderRadius: 14 },
  eventImagePlaceholder: { width: 64, height: 64, borderRadius: 14, backgroundColor: '#eee' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: BRAND.textPrimary },
  eventMeta: { fontSize: 12, color: BRAND.textMuted, marginTop: 3 },
  eventPrice: { fontSize: 14, fontWeight: '700', color: BRAND.accent, marginTop: 4 },
});