import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

// Screen 12 — Select Profile
// Part of the post-signup setup flow: Sign Up → Create Username →
// Select Profile → Select Favorites → Home
export default function SelectProfile() {
  const router = useRouter();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [continuing, setContinuing] = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function uploadAvatar(uri: string, userId: string): Promise<string | null> {
    const ext = uri.split('.').pop() ?? 'jpg';
    const path = `${userId}/avatar.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

    if (error) {
      Alert.alert('Upload failed', error.message);
      return null;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleContinue() {
    setContinuing(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && avatarUri) {
      setUploading(true);
      const publicUrl = await uploadAvatar(avatarUri, user.id);
      setUploading(false);

      if (publicUrl) {
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      }
    }

    setContinuing(false);
    router.replace('/(onboarding)/select-favorites');
  }

  function handleSkip() {
    router.replace('/(onboarding)/select-favorites');
  }

  const busy = uploading || continuing;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add a Profile Photo</Text>
        <Text style={styles.subtitle}>Help others recognize you. You can always change this later.</Text>
      </View>

      <View style={styles.avatarSection}>
        <Pressable style={styles.avatarWrap} onPress={pickImage}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={BRAND.textMuted} />
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </Pressable>

        <Pressable onPress={pickImage}>
          <Text style={styles.chooseText}>
            {avatarUri ? 'Choose a different photo' : 'Choose a photo'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, busy && styles.primaryButtonDisabled]}
          onPress={handleContinue}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </Pressable>

        <Pressable onPress={handleSkip} disabled={busy}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const BRAND = {
  background: '#14121F',
  card: 'rgba(255,255,255,0.06)',
  accent: '#FF6B4A',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  border: 'rgba(255,255,255,0.1)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background, paddingHorizontal: 24 },
  header: { marginTop: 80, marginBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: BRAND.textPrimary },
  subtitle: { fontSize: 14, color: BRAND.textMuted, marginTop: 10, lineHeight: 20 },

  avatarSection: { alignItems: 'center', flex: 1 },
  avatarWrap: { marginBottom: 16 },
  avatar: { width: 140, height: 140, borderRadius: 70 },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: BRAND.card,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: BRAND.background,
  },
  chooseText: { color: BRAND.accent, fontSize: 14, fontWeight: '600' },

  footer: { paddingBottom: 48, gap: 16, alignItems: 'center' },
  primaryButton: {
    width: '100%',
    backgroundColor: BRAND.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipText: { color: BRAND.textMuted, fontSize: 14, fontWeight: '600' },
});