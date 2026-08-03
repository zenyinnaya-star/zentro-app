import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Animated,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

// Screen 18 — Order Detail
// Quantity stepper + price breakdown + payment method row + promo code.
// "Confirm & Pay" should call a Supabase Edge Function that talks to Stripe
// server-side — never process real payment on the client.

type EventSummary = {
  id: string;
  title: string;
  image_url: string | null;
  location: string;
  date: string;
  price: number;
  is_free?: boolean;
};

const SERVICE_FEE_RATE = 0.05; // 5% — adjust to your actual fee model

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

export default function OrderDetail() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('events').select('*').eq('id', eventId).single();
      if (data) setEvent(data as EventSummary);
      setLoading(false);
    })();
  }, [eventId]);

  if (loading || !event) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BRAND.accent} />
      </View>
    );
  }

  const unitPrice = event.is_free ? 0 : event.price;
  const subtotal = unitPrice * quantity;
  const serviceFee = subtotal * SERVICE_FEE_RATE;
  const total = subtotal + serviceFee;

  function changeQuantity(delta: number) {
    setQuantity((q) => Math.max(1, Math.min(10, q + delta)));
  }

  function handleApplyPromo() {
    // NOTE: there's no `promo_codes` table yet, so this just validates the
    // field isn't empty. Wire this to a real lookup + discount calc once
    // that table exists.
    if (!promoCode.trim()) {
      Alert.alert('Enter a code', 'Type a promo code before applying.');
      return;
    }
    setPromoApplied(true);
    Alert.alert('Promo code saved', 'It will be included with your order for review.');
  }

  async function handleConfirmAndPay() {
    setSubmitting(true);
    try {
      // NOTE: this inserts directly from the client as a placeholder. Before
      // launch, swap this for a call to a Supabase Edge Function that creates
      // the Stripe PaymentIntent server-side and only inserts orders/tickets
      // once the charge succeeds — never trust the client to say "paid".
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Please log in', 'You need to be signed in to book a ticket.');
        router.push('/(auth)/login');
        return;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          event_id: event.id,
          quantity,
          promo_code: promoCode || null,
          payment_method: paymentMethod,
          subtotal,
          service_fee: serviceFee,
          total,
          status: 'paid',
        })
        .select()
        .single();

      if (orderError || !order) throw orderError ?? new Error('Order creation failed');

      const holderName =
        (user.user_metadata?.username as string | undefined) ??
        (user.email as string | undefined) ??
        'Guest';

      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          order_id: order.id,
          user_id: user.id,
          event_id: event.id,
          event_title: event.title,
          event_image_url: event.image_url,
          event_location: event.location,
          event_date: event.date,
          quantity,
          holder_name: holderName,
          status: 'upcoming',
        })
        .select()
        .single();

      if (ticketError || !ticket) throw ticketError ?? new Error('Ticket creation failed');

      router.replace({
        pathname: '/ticket/booked',
        params: {
          ticketId: ticket.id,
          eventTitle: event.title,
          eventImageUrl: event.image_url ?? '',
        },
      });
    } catch (err) {
      Alert.alert('Payment failed', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.header}>
          <Tappable style={styles.roundButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={BRAND.textPrimary} />
          </Tappable>
          <Text style={styles.headerTitle}>Order Detail</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Event summary */}
          <View style={styles.eventCard}>
            {event.image_url ? (
              <Image source={{ uri: event.image_url }} style={styles.eventImage} />
            ) : (
              <View style={styles.eventImagePlaceholder} />
            )}
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
              <Text style={styles.eventMeta}>{formatDate(event.date)}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={12} color={BRAND.textMuted} />
                <Text style={styles.eventMeta}>{event.location}</Text>
              </View>
            </View>
          </View>

          {/* Ticket quantity */}
          <Text style={styles.sectionTitle}>Tickets</Text>
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Number of tickets</Text>
            <View style={styles.stepper}>
              <Tappable style={styles.stepperButton} onPress={() => changeQuantity(-1)}>
                <Ionicons name="remove" size={16} color={BRAND.textPrimary} />
              </Tappable>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <Tappable style={styles.stepperButton} onPress={() => changeQuantity(1)}>
                <Ionicons name="add" size={16} color={BRAND.textPrimary} />
              </Tappable>
            </View>
          </View>

          {/* Payment method */}
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentRow}>
            <Tappable
              style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('card')}
              scaleTo={0.98}
            >
              <Ionicons name="card-outline" size={18} color={paymentMethod === 'card' ? '#fff' : BRAND.textPrimary} />
              <Text style={[styles.paymentOptionText, paymentMethod === 'card' && styles.paymentOptionTextActive]}>
                Card
              </Text>
            </Tappable>
            <Tappable
              style={[styles.paymentOption, paymentMethod === 'paypal' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('paypal')}
              scaleTo={0.98}
            >
              <Ionicons name="logo-paypal" size={18} color={paymentMethod === 'paypal' ? '#fff' : BRAND.textPrimary} />
              <Text style={[styles.paymentOptionText, paymentMethod === 'paypal' && styles.paymentOptionTextActive]}>
                PayPal
              </Text>
            </Tappable>
          </View>

          {/* Promo code */}
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.promoRow}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter code"
              placeholderTextColor={BRAND.textMuted}
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
            />
            <Tappable style={styles.promoApplyButton} onPress={handleApplyPromo}>
              <Text style={styles.promoApplyText}>{promoApplied ? 'Applied' : 'Apply'}</Text>
            </Tappable>
          </View>

          {/* Price breakdown */}
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>Subtotal ({quantity} ticket{quantity > 1 ? 's' : ''})</Text>
              <Text style={styles.priceRowValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>Service Fee</Text>
              <Text style={styles.priceRowValue}>${serviceFee.toFixed(2)}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed bottom bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>${total.toFixed(2)}</Text>
        </View>
        <Tappable
          style={[styles.payButton, submitting && styles.payButtonDisabled]}
          onPress={handleConfirmAndPay}
          scaleTo={0.97}
        >
          <Text style={styles.payButtonText}>
            {submitting ? 'Processing…' : 'Confirm & Pay'}
          </Text>
        </Tappable>
      </View>
    </View>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const BRAND = {
  background: '#14121F',
  card: 'rgba(255,255,255,0.05)',
  accent: '#FF6B4A',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  border: 'rgba(255,255,255,0.1)',
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

  content: { paddingHorizontal: 20 },

  eventCard: { flexDirection: 'row', backgroundColor: BRAND.card, borderRadius: 16, padding: 12, gap: 12, marginBottom: 24 },
  eventImage: { width: 64, height: 64, borderRadius: 12 },
  eventImagePlaceholder: { width: 64, height: 64, borderRadius: 12, backgroundColor: BRAND.border },
  eventInfo: { flex: 1 },
  eventTitle: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '700' },
  eventMeta: { color: BRAND.textMuted, fontSize: 12, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },

  sectionTitle: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 12 },

  quantityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BRAND.card, borderRadius: 14, padding: 14, marginBottom: 24,
  },
  quantityLabel: { color: BRAND.textPrimary, fontSize: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperButton: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: BRAND.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperValue: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '700', minWidth: 16, textAlign: 'center' },

  paymentRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  paymentOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: BRAND.border, backgroundColor: BRAND.card,
  },
  paymentOptionActive: { backgroundColor: BRAND.accent, borderColor: BRAND.accent },
  paymentOptionText: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '600' },
  paymentOptionTextActive: { color: '#fff' },

  promoRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  promoInput: {
    flex: 1, backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.border,
    borderRadius: 14, paddingHorizontal: 16, color: BRAND.textPrimary, fontSize: 14,
  },
  promoApplyButton: {
    paddingHorizontal: 20, borderRadius: 14, backgroundColor: BRAND.card,
    borderWidth: 1, borderColor: BRAND.border, alignItems: 'center', justifyContent: 'center',
  },
  promoApplyText: { color: BRAND.accent, fontSize: 13, fontWeight: '700' },

  priceBreakdown: { backgroundColor: BRAND.card, borderRadius: 14, padding: 16, gap: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceRowLabel: { color: BRAND.textMuted, fontSize: 13 },
  priceRowValue: { color: BRAND.textPrimary, fontSize: 13, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderColor: BRAND.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '700' },
  totalValue: { color: BRAND.accent, fontSize: 16, fontWeight: '800' },

  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BRAND.background, borderTopWidth: 1, borderColor: BRAND.border,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 34,
  },
  priceLabel: { color: BRAND.textMuted, fontSize: 12 },
  priceValue: { color: BRAND.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 2 },
  payButton: { backgroundColor: BRAND.accent, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 14 },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
