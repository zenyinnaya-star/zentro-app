import { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

// Screen 13 — Select Favourite (categories)
const CATEGORIES = [
  { key: 'business', label: 'Business', emoji: '💼' },
  { key: 'community', label: 'Community', emoji: '🙌' },
  { key: 'music', label: 'Music & Entertainment', emoji: '🎙️' },
  { key: 'health', label: 'Health', emoji: '💉' },
  { key: 'food', label: 'Food & drink', emoji: '🍟' },
  { key: 'family', label: 'Family & Education', emoji: '👨‍👩‍👧' },
  { key: 'sport', label: 'Sport', emoji: '⚽' },
  { key: 'fashion', label: 'Fashion', emoji: '👠' },
  { key: 'film', label: 'Film & Media', emoji: '🎞️' },
  { key: 'home', label: 'Home & Lifestyle', emoji: '🏡' },
  { key: 'design', label: 'Design', emoji: '🎨' },
  { key: 'gaming', label: 'Gaming', emoji: '🎮' },
  { key: 'tech', label: 'Science & Tech', emoji: '🔬' },
  { key: 'education', label: 'School & Education', emoji: '📚' },
  { key: 'holiday', label: 'Holiday', emoji: '🏖️' },
  { key: 'travel', label: 'Travel', emoji: '✈️' },
];

const MIN_SELECTIONS = 1;

/* ---------- Reusable animated press wrapper ---------- */
function Tappable({
  onPress,
  style,
  children,
  scaleTo = 0.94,
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

export default function SelectFavorites() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleCategory(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleFinish() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('profiles')
        .update({ favorite_categories: selected })
        .eq('id', user.id);
    }

    setSaving(false);
    router.replace('/(tabs)/home');
  }

  const canFinish = selected.length >= MIN_SELECTIONS;

  return (
    <View style={styles.container}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Tappable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={BRAND.textPrimary} />
        </Tappable>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressRow}>
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={[styles.progressBar, styles.progressActive]} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Choose your favorite event</Text>
        <Text style={styles.subtitle}>Get personalized event recommendations.</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.chipsWrap}>
        {CATEGORIES.map((cat) => {
          const active = selected.includes(cat.key);
          return (
            <Tappable
              key={cat.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleCategory(cat.key)}
            >
              <Text style={styles.chipEmoji}>{cat.emoji}</Text>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.label}</Text>
            </Tappable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.finishButton, !canFinish && styles.finishButtonDisabled]}
          onPress={handleFinish}
          disabled={!canFinish || saving}
        >
          <Text style={styles.finishButtonText}>{saving ? 'Saving…' : 'Finish'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const BRAND = {
  background: '#FFFFFF',
  card: '#FAFAFC',
  accent: '#FF383C',
  textPrimary: '#25131A',
  textMuted: '#928A8D',
  border: '#F0EEF1',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },

  navBar: { paddingHorizontal: 20, paddingTop: 56, marginBottom: 20 },

  progressRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 24 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: BRAND.border },
  progressActive: { backgroundColor: BRAND.accent },

  header: { paddingHorizontal: 20, marginBottom: 24 },
  title: { color: BRAND.textPrimary, fontSize: 26, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: BRAND.textMuted, fontSize: 15 },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  chipActive: { backgroundColor: BRAND.accent },
  chipEmoji: { fontSize: 17 },
  chipText: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  footer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  finishButton: { backgroundColor: BRAND.accent, paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  finishButtonDisabled: { backgroundColor: BRAND.border },
  finishButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
