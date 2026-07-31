import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

// Screen 29 — Edit Profile
export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const { data } = await supabase
        .from('profiles')
        .select('username, bio, avatar_url')
        .eq('id', user.id)
        .single();
      if (data) {
        setUsername(data.username ?? '');
        setBio(data.bio ?? '');
        setAvatarUrl(data.avatar_url ?? null);
      }
      setLoading(false);
    })();
  }, []);

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !userId) return;

    setAvatarUploading(true);
    const file = result.assets[0];
    const ext = file.uri.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const response = await fetch(file.uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: file.mimeType ?? 'image/jpeg' });

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(publicUrl.publicUrl);
    }
    setAvatarUploading(false);
  }

  async function handleSave() {
    if (!userId) return;
    if (!username.trim()) {
      Alert.alert('Username required', 'Please enter a username.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username, bio, avatar_url: avatarUrl })
      .eq('id', userId);
    setSaving(false);

    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    router.back();
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BRAND.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable style={styles.roundButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={BRAND.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Pressable style={styles.avatarWrap} onPress={pickAvatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color={BRAND.textMuted} />
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            {avatarUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={14} color="#fff" />
            )}
          </View>
        </Pressable>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Your username"
          placeholderTextColor={BRAND.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell people a bit about yourself…"
          placeholderTextColor={BRAND.textMuted}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.footer}>
        <Pressable style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const BRAND = {
  background: '#14121F', card: 'rgba(255,255,255,0.05)', accent: '#FF3D8F',
  textPrimary: '#FFFFFF', textMuted: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.1)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  loadingContainer: { flex: 1, backgroundColor: BRAND.background, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
  },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: BRAND.textPrimary, fontSize: 17, fontWeight: '700' },

  content: { flex: 1, paddingHorizontal: 20 },
  avatarWrap: { alignSelf: 'center', marginBottom: 28 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: BRAND.card, alignItems: 'center', justifyContent: 'center' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15,
    backgroundColor: BRAND.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BRAND.background,
  },

  label: { color: BRAND.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: BRAND.textPrimary, fontSize: 14, marginBottom: 20,
  },
  textArea: { minHeight: 100 },

  footer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  saveButton: { backgroundColor: BRAND.accent, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});