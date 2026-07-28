// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

// Screen 11 — Create Username

const BRAND = {
  background: '#14121F',
  accent: '#FF6B4A',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  inputBg: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.1)',
  danger: '#FF6B6B',
  success: '#4ADE80',
};

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default function CreateUsername() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [saving, setSaving] = useState(false);
  const userIdRef = useRef(null);
  const checkTimer = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null;
    });
  }, []);

  useEffect(() => {
    setAvailable(null);
    if (checkTimer.current) clearTimeout(checkTimer.current);

    const candidate = username.trim().toLowerCase();
    if (!USERNAME_RE.test(candidate)) return;

    checkTimer.current = setTimeout(async () => {
      setChecking(true);
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', candidate)
        .maybeSingle();
      setChecking(false);
      setAvailable(!data || data.id === userIdRef.current);
    }, 500);

    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [username]);

  async function handleContinue() {
    const candidate = username.trim().toLowerCase();
    if (!USERNAME_RE.test(candidate)) {
      Alert.alert('Invalid username', '3-20 characters: lowercase letters, numbers, underscores.');
      return;
    }
    if (!userIdRef.current) {
      Alert.alert('Not signed in', 'Please sign up or log in again.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: candidate })
      .eq('id', userIdRef.current);
    setSaving(false);

    if (error) {
      if (error.code === '23505') {
        setAvailable(false);
        Alert.alert('Username taken', 'Pick another username.');
      } else {
        Alert.alert('Could not save', error.message);
      }
      return;
    }
    router.replace('/(auth)/select-profile');
  }

  const normalized = username.trim().toLowerCase();
  const canContinue = USERNAME_RE.test(normalized) && available !== false && !checking && !saving;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Pick a Username</Text>
        <Text style={styles.subtitle}>This is how others will find you on Zentro.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="username"
          placeholderTextColor={BRAND.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {checking && <Text style={styles.hint}>Checking availability…</Text>}
        {!checking && available === true && (
          <Text style={[styles.hint, { color: BRAND.success }]}>Username available</Text>
        )}
        {!checking && available === false && (
          <Text style={[styles.hint, { color: BRAND.danger }]}>Username taken</Text>
        )}

        <Pressable
          style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Continue'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background, paddingHorizontal: 24 },
  header: { marginTop: 80, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: BRAND.textPrimary },
  subtitle: { fontSize: 14, color: BRAND.textMuted, marginTop: 8 },
  form: { gap: 10 },
  input: {
    backgroundColor: BRAND.inputBg,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: BRAND.textPrimary,
    fontSize: 15,
  },
  hint: { fontSize: 13, marginLeft: 4, color: BRAND.textMuted },
  primaryButton: {
    backgroundColor: BRAND.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
