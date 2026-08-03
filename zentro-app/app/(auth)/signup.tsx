// @ts-nocheck
import { useState } from 'react';
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
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

// Screen 06 — Sign Up
export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Missing info', 'Fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }
    // Move into profile setup — this is a fresh account, so it hasn't
    // picked a username/photo/categories yet.
    router.replace('/(auth)/create-username');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Zentro to start booking events.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={BRAND.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={BRAND.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={BRAND.textMuted}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Pressable style={styles.primaryButton} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Uses Supabase OAuth — Google/Facebook providers must be enabled
            in Supabase Auth settings with matching redirect URLs first. */}
        <View style={styles.socialRow}>
          <Pressable
            style={styles.socialButton}
            onPress={() => handleOAuth('google')}
          >
            <Text style={styles.socialButtonText}>Google</Text>
          </Pressable>
          <Pressable
            style={styles.socialButton}
            onPress={() => handleOAuth('facebook')}
          >
            <Text style={styles.socialButtonText}>Facebook</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/login" replace>
          <Text style={styles.footerLink}>Log In</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

async function handleOAuth(provider: 'google' | 'facebook') {
  const { error } = await supabase.auth.signInWithOAuth({ provider });
  if (error) Alert.alert('Sign up failed', error.message);
}

const BRAND = {
  background: '#14121F',
  accent: '#FF6B4A',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  inputBg: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.1)',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background, paddingHorizontal: 24 },
  header: { marginTop: 80, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: BRAND.textPrimary },
  subtitle: { fontSize: 14, color: BRAND.textMuted, marginTop: 8 },
  form: { gap: 14 },
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
  primaryButton: {
    backgroundColor: BRAND.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 22, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BRAND.border },
  dividerText: { color: BRAND.textMuted, fontSize: 12 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  socialButtonText: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  footerText: { color: BRAND.textMuted, fontSize: 14 },
  footerLink: { color: BRAND.accent, fontSize: 14, fontWeight: '700' },
});
