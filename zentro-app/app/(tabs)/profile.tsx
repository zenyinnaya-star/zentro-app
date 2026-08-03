import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme, DARK } from '../../context/ThemeContext';

// Screen 28 — My Profile
type Profile = {
  username: string;
  avatar_url: string | null;
  email: string;
  tickets_count?: number;
  favorites_count?: number;
  reviews_count?: number;
};

const MENU_ITEMS = [
  { key: 'tickets', icon: 'ticket-outline' as const, label: 'My Tickets', route: '/(tabs)/tickets/upcoming' },
  { key: 'favorites', icon: 'heart-outline' as const, label: 'Favorites', route: '/(tabs)/favorites' },
  { key: 'notifications', icon: 'notifications-outline' as const, label: 'Notifications', route: '/notifications' },
  { key: 'help', icon: 'help-circle-outline' as const, label: 'Help & Support', route: null },
  { key: 'privacy', icon: 'shield-checkmark-outline' as const, label: 'Privacy Policy', route: null },
];

export default function MyProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDark, colors: BRAND, toggleTheme } = useTheme();

  const styles = useMemo(() => makeStyles(BRAND), [BRAND]);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    setProfile({
      username: data?.username ?? 'User',
      avatar_url: data?.avatar_url ?? null,
      email: user.email ?? '',
    });
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleLogout() {
    Alert.alert('Log out?', 'You can log back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
    // app/_layout.tsx's session listener redirects to (auth) automatically after signOut.
  }

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BRAND.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={30} color={BRAND.textMuted} />
          </View>
        )}
        <Text style={styles.username}>{profile.username}</Text>
        <Text style={styles.email}>{profile.email}</Text>

        <Pressable style={styles.editButton} onPress={() => router.push('/profile/edit')}>
          <Ionicons name="create-outline" size={14} color={BRAND.accent} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>
      </View>

      <View style={styles.menu}>
        <View style={styles.menuRow}>
          <View style={styles.menuIconWrap}>
            <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={BRAND.textPrimary} />
          </View>
          <Text style={styles.menuLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: BRAND.border, true: BRAND.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            style={styles.menuRow}
            onPress={() => item.route && router.push(item.route as any)}
          >
            <View style={styles.menuIconWrap}>
              <Ionicons name={item.icon} size={18} color={BRAND.textPrimary} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={BRAND.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#FF5252" />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(BRAND: typeof DARK) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: BRAND.background },
    loadingContainer: { flex: 1, backgroundColor: BRAND.background, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 },

    profileHeader: { alignItems: 'center', marginBottom: 30 },
    avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 14 },
    avatarPlaceholder: {
      width: 88, height: 88, borderRadius: 44, backgroundColor: BRAND.card,
      alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    },
    username: { color: BRAND.textPrimary, fontSize: 19, fontWeight: '800' },
    email: { color: BRAND.textMuted, fontSize: 13, marginTop: 4 },
    editButton: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      marginTop: 14, paddingHorizontal: 16, paddingVertical: 8,
      borderRadius: 20, borderWidth: 1, borderColor: BRAND.accent,
    },
    editButtonText: { color: BRAND.accent, fontSize: 12, fontWeight: '700' },

    menu: { backgroundColor: BRAND.card, borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
    menuRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: BRAND.border,
    },
    menuIconWrap: { width: 30, alignItems: 'center' },
    menuLabel: { flex: 1, color: BRAND.textPrimary, fontSize: 14, fontWeight: '500' },

    logoutButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,82,82,0.3)',
    },
    logoutText: { color: '#FF5252', fontSize: 14, fontWeight: '700' },
  });
}
