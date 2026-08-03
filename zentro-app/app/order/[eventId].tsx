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
  disabled,
}: {
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
  scaleTo?: number;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  function pressIn() {
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  }
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/* ---------- Animated section wrapper (staggered entrance) ---------- */
function FadeInSection({ index = 0, style, children }: { index?: number; style?: any; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay: index * 70, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: index * 70, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

/* ---------- Payment method radio row ---------- */
function PaymentRow({
  active,
  iconBg,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Tappable style={[styles.paymentRow, active && styles.paymentRowActive]} onPress={onPress} scaleTo={0.98}>
      <View style={[styles.paymentIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.paymentLabel}>{label}</Text>
      <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
        {active && <View style={styles.radioInner} />}
      </View>
    </Tappable>
  );
}

export default function OrderDetail() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(2);
  const [promoCode, setPromoCode] = useState('');
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

  const currentEvent = event;

  const unitPrice = currentEvent.is_free ? 0 : currentEvent.price;
  const subtotal = unitPrice * quantity;
  const serviceFee = subtotal * SERVICE_FEE_RATE;
  const total = subtotal + serviceFee;

  function changeQuantity(delta: number) {
    setQuantity((q) => Math.max(1, Math.min(10, q + delta)));
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
          event_id: currentEvent.id,
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
          event_id: currentEvent.id,
          event_title: currentEvent.title,
          event_image_url: currentEvent.image_url,
          event_location: currentEvent.location,
          event_date: currentEvent.date,
          quantity,
          holder_name: holderName,
          status: 'upcoming',
        })
        .select()
        .single();

      if (ticketError || !ticket) throw ticketError ?? new Error('Ticket creation failed');

      // push (not replace) so Ticket Booked can present as a sheet over this screen.
      router.push({
        pathname: '/ticket/booked',
        params: {
          ticketId: ticket.id,
          eventTitle: currentEvent.title,
          eventImageUrl: currentEvent.image_url ?? '',
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
          <FadeInSection index={0} style={styles.eventCard}>
            {event.image_url ? (
              <Image source={{ uri: event.image_url }} style={styles.eventImage} />
            ) : (
              <View style={styles.eventImagePlaceholder} />
            )}
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={12} color={BRAND.textMuted} />
                <Text style={styles.eventMeta}>{formatDate(event.date)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={12} color={BRAND.textMuted} />
                <Text style={styles.eventMeta}>{event.location}</Text>
              </View>
            </View>
          </FadeInSection>

          {/* Ticket quantity */}
          <FadeInSection index={1}>
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
          </FadeInSection>

          {/* Payment method */}
          <FadeInSection index={2}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentList}>
              <PaymentRow
                active={paymentMethod === 'card'}
                onPress={() => setPaymentMethod('card')}
                iconBg="rgba(255,61,143,0.12)"
                icon={<Ionicons name="card" size={18} color={BRAND.accent} />}
                label="Credit/Debit Card"
              />
              <PaymentRow
                active={paymentMethod === 'paypal'}
                onPress={() => setPaymentMethod('paypal')}
                iconBg="rgba(0,112,209,0.12)"
                icon={<Ionicons name="logo-paypal" size={18} color="#0070D1" />}
                label="Paypal"
              />
            </View>
          </FadeInSection>

          {/* Promo code */}
          <FadeInSection index={3}>
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
              <Tappable style={styles.promoApplyButton}>
                <Text style={styles.promoApplyText}>Apply</Text>
              </Tappable>
            </View>
          </FadeInSection>

          {/* Price breakdown */}
          <FadeInSection index={4}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>{quantity}x Ticket price</Text>
                <Text style={styles.priceRowValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>Subtotal</Text>
                <Text style={styles.priceRowValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>Fees</Text>
                <Text style={styles.priceRowValue}>${serviceFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </FadeInSection>
        </View>
      </ScrollView>

      {/* Fixed bottom bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>${total.toFixed(2)}</Text>
        </View>
        <Tappable
          style={[styles.payButton, submitting && styles.payButtonDisabled]}
          onPress={handleConfirmAndPay}
          scaleTo={0.97}
          disabled={submitting}
        >
          <Text style={styles.payButtonText}>
            {submitting ? 'Processing…' : 'Place Order'}
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
    }).toUpperCase();
  } catch {
    return iso;
  }
}

const BRAND = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  accent: '#FF3D8F',
  textPrimary: '#1A1523',
  textMuted: '#9C98A3',
  border: '#F0EEF1',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.background },
  loadingContainer: { flex: 1, backgroundColor: BRAND.background, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
  },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F1F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: BRAND.textPrimary, fontSize: 17, fontWeight: '800' },

  content: { paddingHorizontal: 20 },

  eventCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: BRAND.border,
    padding: 12, gap: 12, marginBottom: 24,
    shadowColor: '#1A1523', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  eventImage: { width: 64, height: 64, borderRadius: 12 },
  eventImagePlaceholder: { width: 64, height: 64, borderRadius: 12, backgroundColor: BRAND.border },
  eventInfo: { flex: 1, justifyContent: 'center' },
  eventTitle: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  eventMeta: { color: BRAND.textMuted, fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },

  sectionTitle: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 12 },

  quantityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderWidth: 1, borderColor: BRAND.border, borderRadius: 14, padding: 14, marginBottom: 24,
  },
  quantityLabel: { color: BRAND.textPrimary, fontSize: 14, fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperButton: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: '#F3F1F5',
    alignItems: 'center', justifyContent: 'center',
  },
  stepperValue: { color: BRAND.textPrimary, fontSize: 15, fontWeight: '700', minWidth: 16, textAlign: 'center' },

  paymentList: { gap: 12, marginBottom: 24 },
  paymentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: BRAND.border, backgroundColor: '#fff',
  },
  paymentRowActive: { borderColor: BRAND.accent },
  paymentIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  paymentLabel: { flex: 1, color: BRAND.textPrimary, fontSize: 14, fontWeight: '600' },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: BRAND.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: BRAND.accent },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: BRAND.accent },

  promoRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  promoInput: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: BRAND.border,
    borderRadius: 14, paddingHorizontal: 16, color: BRAND.textPrimary, fontSize: 14,
  },
  promoApplyButton: {
    paddingHorizontal: 20, borderRadius: 14, backgroundColor: '#F3F1F5',
    alignItems: 'center', justifyContent: 'center',
  },
  promoApplyText: { color: BRAND.accent, fontSize: 13, fontWeight: '700' },

  priceBreakdown: { gap: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceRowLabel: { color: BRAND.textMuted, fontSize: 13 },
  priceRowValue: { color: BRAND.textPrimary, fontSize: 13, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderColor: BRAND.border, paddingTop: 12, marginTop: 2 },
  totalLabel: { color: BRAND.textPrimary, fontSize: 16, fontWeight: '800' },
  totalValue: { color: BRAND.textPrimary, fontSize: 16, fontWeight: '800' },

  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderTopWidth: 1, borderColor: BRAND.border,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 34,
  },
  priceLabel: { color: BRAND.textMuted, fontSize: 12 },
  priceValue: { color: BRAND.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 2 },
  payButton: { backgroundColor: BRAND.accent, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 14 },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
