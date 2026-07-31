import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Animated, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

// Screen 25 — Write a Review
// `id` here is the ticket id. Expects a `reviews` table:
// id, ticket_id, event_id, user_id, rating (1-5), comment, created_at
type TicketSummary = { id: string; event_id: string; event_title: string; event_image_url: string | null };

export default function WriteReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('tickets')
        .select('id, event_id, event_title, event_image_url')
        .eq('id', id)
        .single();
      if (data) setTicket(data as TicketSummary);
      setLoading(false);
    })();
  }, [id]);

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Add a rating', 'Tap a star to rate this event before submitting.');
      return;
    }
    if (!ticket) return;

    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from('reviews').insert({
      ticket_id: ticket.id,
      event_id: ticket.event_id,
      user_id: user?.id,
      rating,
      comment,
    });

    if (!error) {
      await supabase.from('tickets').update({ has_review: true }).eq('id', ticket.id);
    }
    setSubmitting(false);

    if (error) {
      Alert.alert('Could not submit review', error.message);
      return;
    }
    router.back();
  }

  if (loading || !ticket) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BRAND.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable style={styles.roundButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={BRAND.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.eventTitle}>{ticket.event_title}</Text>
        <Text style={styles.prompt}>How was your experience?</Text>

        <StarRating rating={rating} onChange={setRating} />

        <Text style={styles.label}>Your review</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Tell others what you thought about this event…"
          placeholderTextColor={BRAND.textMuted}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Submitting…' : 'Submit Review'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function StarRating({ rating, onChange }: { rating: number; onChange: (n: number) => void }) {
  const scales = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

  function pressStar(n: number) {
    onChange(n);
    Animated.sequence([
      Animated.spring(scales[n - 1], { toValue: 1.3, useNativeDriver: true, speed: 60, bounciness: 12 }),
      Animated.spring(scales[n - 1], { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();
  }

  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => pressStar(n)} hitSlop={8}>
          <Animated.View style={{ transform: [{ scale: scales[n - 1] }] }}>
            <Ionicons
              name={n <= rating ? 'star' : 'star-outline'}
              size={34}
              color={n <= rating ? BRAND.accent : BRAND.textMuted}
            />
          </Animated.View>
        </Pressable>
      ))}
    </View>
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

  content: { flex: 1, paddingHorizontal: 20, alignItems: 'center' },
  eventTitle: { color: BRAND.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  prompt: { color: BRAND.textMuted, fontSize: 13, marginBottom: 20 },

  starsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },

  label: { alignSelf: 'flex-start', color: BRAND.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  textArea: {
    width: '100%', backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border,
    borderRadius: 14, padding: 16, color: BRAND.textPrimary, fontSize: 14, minHeight: 130,
  },

  footer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  submitButton: { backgroundColor: BRAND.accent, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
