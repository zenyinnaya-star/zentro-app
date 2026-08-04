import { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, Pressable, Animated, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../../lib/supabase';

// Screen 27 — Party Group
// Expects `party_groups` (id, event_id, name, invite_code, created_by) and
// `party_group_members` (group_id, user_id, username, avatar_url, status).
// `eventId` param determines which event's group this is / creates one for.

type Member = { id: string; username: string; avatar_url: string | null; status: 'joined' | 'invited' };
type GroupInfo = { id: string; name: string; invite_code: string; event_title: string };

/* ---------- Reusable animated press wrapper ---------- */
function Tappable({ onPress, style, children, scaleTo = 0.96 }: any) {
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

export default function PartyGroup() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: groupData } = await supabase
      .from('party_groups')
      .select('id, name, invite_code, event:events(title)')
      .eq('event_id', eventId)
      .maybeSingle();

    if (groupData) {
      setGroup({
        id: groupData.id,
        name: groupData.name,
        invite_code: groupData.invite_code,
        event_title: (groupData as any).event?.title ?? '',
      });
      const { data: memberData } = await supabase
        .from('party_group_members')
        .select('id, username, avatar_url, status')
        .eq('group_id', groupData.id);
      if (memberData) setMembers(memberData as Member[]);
    }
    setLoading(false);
  }, [eventId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function createGroup() {
    if (!eventId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const { data: newGroup, error } = await supabase
      .from('party_groups')
      .insert({ event_id: eventId, name: 'My Party Group', invite_code: inviteCode, created_by: user?.id })
      .select()
      .single();

    if (error || !newGroup) {
      Alert.alert('Could not create group', error?.message ?? 'Please try again.');
      return;
    }

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      await supabase.from('party_group_members').insert({
        group_id: newGroup.id,
        user_id: user.id,
        username: profile?.username ?? user.email ?? 'You',
        avatar_url: profile?.avatar_url ?? null,
        status: 'joined',
      });
    }

    load();
  }

  async function sendInvite() {
    if (!inviteEmail.trim() || !group) return;
    setInviting(true);
    // TODO: replace with a Supabase Edge Function that emails/SMS the invite
    // and inserts a pending row into `party_group_members`.
    await supabase.from('party_group_members').insert({
      group_id: group.id,
      username: inviteEmail,
      status: 'invited',
    });
    setInviteEmail('');
    setInviting(false);
    load();
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BRAND.accent} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={40} color={BRAND.textMuted} />
          <Text style={styles.emptyTitle}>No party group yet</Text>
          <Text style={styles.emptySubtitle}>Start a group to coordinate this event with friends.</Text>
          <Tappable style={styles.createButton} onPress={createGroup}>
            <Text style={styles.createButtonText}>Create Party Group</Text>
          </Tappable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eventTitle}>{group.event_title}</Text>
        <Text style={styles.groupName}>{group.name}</Text>
      </View>

      {/* Invite code */}
      <View style={styles.codeCard}>
        <View>
          <Text style={styles.codeLabel}>Invite Code</Text>
          <Text style={styles.codeValue}>{group.invite_code}</Text>
        </View>
        <Tappable
          style={styles.copyButton}
          onPress={async () => {
            await Clipboard.setStringAsync(group.invite_code);
            Alert.alert('Copied', 'Invite code copied to clipboard.');
          }}
        >
          <Ionicons name="copy-outline" size={16} color={BRAND.accent} />
        </Tappable>
      </View>

      {/* Invite by contact */}
      <View style={styles.inviteRow}>
        <TextInput
          style={styles.inviteInput}
          placeholder="Invite by email or username"
          placeholderTextColor={BRAND.textMuted}
          value={inviteEmail}
          onChangeText={setInviteEmail}
          autoCapitalize="none"
        />
        <Tappable style={styles.inviteButton} onPress={sendInvite}>
          <Text style={styles.inviteButtonText}>{inviting ? '…' : 'Invite'}</Text>
        </Tappable>
      </View>

      <Text style={styles.sectionTitle}>Members ({members.length})</Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.memberAvatar} />
            ) : (
              <View style={styles.memberAvatarPlaceholder} />
            )}
            <Text style={styles.memberName} numberOfLines={1}>{item.username}</Text>
            <View style={[styles.statusBadge, item.status === 'joined' && styles.statusBadgeJoined]}>
              <Text style={styles.statusBadgeText}>{item.status === 'joined' ? 'Joined' : 'Pending'}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const BRAND = {
  background: '#14121F', card: 'rgba(255,255,255,0.05)', accent: '#FF3D8F',
  textPrimary: '#FFFFFF', textMuted: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.1)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background, paddingHorizontal: 20, paddingTop: 20 },
  loadingContainer: { flex: 1, backgroundColor: BRAND.background, alignItems: 'center', justifyContent: 'center' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 30 },
  emptyTitle: { color: BRAND.textPrimary, fontSize: 16, fontWeight: '700' },
  emptySubtitle: { color: BRAND.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 10 },
  createButton: { backgroundColor: BRAND.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 6 },
  createButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  header: { marginBottom: 18 },
  eventTitle: { color: BRAND.textMuted, fontSize: 12 },
  groupName: { color: BRAND.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 4 },

  codeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BRAND.card, borderRadius: 14, padding: 16, marginBottom: 16,
  },
  codeLabel: { color: BRAND.textMuted, fontSize: 11 },
  codeValue: { color: BRAND.accent, fontSize: 18, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
  copyButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,61,143,0.12)', alignItems: 'center', justifyContent: 'center' },

  inviteRow: { flexDirection: 'row', gap: 10, marginBottom: 26 },
  inviteInput: {
    flex: 1, backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border,
    borderRadius: 14, paddingHorizontal: 16, color: BRAND.textPrimary, fontSize: 13,
  },
  inviteButton: { paddingHorizontal: 18, borderRadius: 14, backgroundColor: BRAND.accent, alignItems: 'center', justifyContent: 'center' },
  inviteButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  sectionTitle: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND.card, borderRadius: 12, padding: 10, marginBottom: 10, gap: 10 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20 },
  memberAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND.border },
  memberName: { flex: 1, color: BRAND.textPrimary, fontSize: 13, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: BRAND.border },
  statusBadgeJoined: { backgroundColor: 'rgba(46,204,113,0.15)' },
  statusBadgeText: { color: BRAND.textPrimary, fontSize: 10, fontWeight: '700' },
});
