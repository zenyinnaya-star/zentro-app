import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

// Screen 30 — Notification
// Expects a `notifications` table: id, user_id, type ('booking'|'reminder'|
// 'social'|'system'), title, body, event_id (nullable), is_read, created_at

type NotificationItem = {
  id: string;
  type: 'booking' | 'reminder' | 'social' | 'system';
  title: string;
  body: string;
  event_id: string | null;
  is_read: boolean;
  created_at: string;
};

const ICONS: Record<NotificationItem['type'], any> = {
  booking: 'ticket-outline',
  reminder: 'alarm-outline',
  social: 'people-outline',
  system: 'information-circle-outline',
};

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data as NotificationItem[]);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true }))); // optimistic
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    }
  }

  async function openNotification(item: NotificationItem) {
    if (!item.is_read) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      await supabase.from('notifications').update({ is_read: true }).eq('id', item.id);
    }
    if (item.event_id) router.push(`/event/${item.event_id}`);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.roundButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={BRAND.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable onPress={markAllRead}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={BRAND.accent} style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={36} color={BRAND.textMuted} />
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => openNotification(item)}>
              {!item.is_read && <View style={styles.unreadDot} />}
              <View style={styles.iconWrap}>
                <Ionicons name={ICONS[item.type]} size={18} color={BRAND.accent} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowTitle, !item.is_read && styles.rowTitleUnread]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.rowTime}>{timeAgo(item.created_at)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const BRAND = {
  background: '#14121F', card: 'rgba(255,255,255,0.05)', accent: '#FF3D8F',
  textPrimary: '#FFFFFF', textMuted: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.1)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
  },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: BRAND.textPrimary, fontSize: 17, fontWeight: '700' },
  markReadText: { color: BRAND.accent, fontSize: 12, fontWeight: '600' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: -60 },
  emptyText: { color: BRAND.textMuted, fontSize: 13 },

  list: { paddingHorizontal: 20, paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: BRAND.card, borderRadius: 14, padding: 14, marginBottom: 12, position: 'relative',
  },
  unreadDot: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.accent },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,61,143,0.12)', alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowTitle: { color: BRAND.textMuted, fontSize: 13, fontWeight: '600' },
  rowTitleUnread: { color: BRAND.textPrimary, fontWeight: '700' },
  rowBody: { color: BRAND.textMuted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  rowTime: { color: BRAND.textMuted, fontSize: 10, marginTop: 6 },
});