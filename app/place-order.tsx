import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { DEFAULT_PRICING, useDoctorContext } from '@/hooks/use-doctor-context'
import { supabase } from '@/lib/supabase.web'

const BLUE = '#6050D0'

const DISEASES = [
  'Diabetes Management',
  'Hypertension (High BP)',
  'Obesity & Weight Management',
  'PCOD / PCOS',
  'Thyroid Disorders',
  'Arthritis & Joint Pain',
  'Digestive Disorders (IBS)',
  'Skin Disorders (Eczema/Psoriasis)',
  'Respiratory Issues (Asthma)',
  'Stress & Anxiety',
  'Insomnia / Sleep Disorders',
  'Cholesterol Management',
  'Chronic Fatigue',
  'Hair Fall & Scalp Issues',
  'Other',
]

const DURATIONS = [
  { key: '7_days' as const, label: '7 Days' },
  { key: '15_days' as const, label: '15 Days' },
  { key: '1_month' as const, label: '1 Month' },
  { key: '2_months' as const, label: '2 Months' },
]

// Replace with your merchant UPI ID
const MERCHANT_UPI_ID = 'merchant@upi'
const MERCHANT_NAME = 'Ayur Wellness'

const UPI_PAYMENT_METHODS = [
  { id: 'gpay', label: 'Google Pay', image: require('@/assets/images/gpay.png'), scheme: 'tez' },
  { id: 'phonepe', label: 'PhonePe', image: require('@/assets/images/phonepe.png'), scheme: 'phonepe' },
  { id: 'paytm', label: 'Paytm', image: require('@/assets/images/paytm.png'), scheme: 'paytm' },
] as const

type DurationKey = '7_days' | '15_days' | '1_month' | '2_months'

export default function PlaceOrderScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { profile } = useAuthContext()
  const { selectedDoctor } = useDoctorContext()

  const [selectedDisease, setSelectedDisease] = useState<string | null>(null)
  const [showDiseaseModal, setShowDiseaseModal] = useState(false)
  const [description, setDescription] = useState('')
  const [selectedDuration, setSelectedDuration] = useState<DurationKey | null>(null)
  const [address, setAddress] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)
  const [attempted, setAttempted] = useState(false)

  // Card fields
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')

  // Inline validation errors
  const errors = {
    disease: attempted && !selectedDisease,
    duration: attempted && !selectedDuration,
    address: attempted && !address.trim(),
    payment: attempted && !selectedPayment,
    cardNumber: attempted && selectedPayment === 'card' && cardNumber.replace(/\s/g, '').length < 16,
    cardName: attempted && selectedPayment === 'card' && !cardName.trim(),
    cardExpiry: attempted && selectedPayment === 'card' && cardExpiry.length < 5,
    cardCvv: attempted && selectedPayment === 'card' && cardCvv.length < 3,
  }

  const fees = selectedDoctor?.medicine_price ?? DEFAULT_PRICING
  const price = selectedDuration ? (fees[selectedDuration] ?? 0) : 0

  const buildUpiUrl = (scheme: string, amount: number) => {
    const params = `pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Ayur Medicine Order')}`
    return `${scheme}://upi/pay?${params}`
  }

  const openUpiApp = async (scheme: string) => {
    const url = buildUpiUrl(scheme, price)
    const canOpen = await Linking.canOpenURL(url)
    if (canOpen) {
      await Linking.openURL(url)
    } else {
      const genericUrl = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${price}&cu=INR&tn=${encodeURIComponent('Ayur Medicine Order')}`
      const canOpenGeneric = await Linking.canOpenURL(genericUrl)
      if (canOpenGeneric) {
        await Linking.openURL(genericUrl)
      } else {
        Alert.alert('App Not Found', 'The selected payment app is not installed on this device.')
        return false
      }
    }
    return true
  }

  const handlePlaceOrder = async () => {
    setAttempted(true)

    if (!selectedDisease || !selectedDuration || !address.trim() || !selectedPayment) return
    if (selectedPayment === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16 || !cardName.trim() || cardExpiry.length < 5 || cardCvv.length < 3) return
    }
    if (!profile?.id) return

    setPlacing(true)

    const upiMethod = UPI_PAYMENT_METHODS.find((m) => m.id === selectedPayment)
    if (upiMethod) {
      const opened = await openUpiApp(upiMethod.scheme)
      if (!opened) {
        setPlacing(false)
        return
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        patient_id: profile.id,
        doctor_id: selectedDoctor?.id ?? null,
        total: price,
        status: 'placed',
        delivery_address: address.trim() ? { address: address.trim() } : null,
      })
      .select()
      .single()

    if (orderError || !order) {
      setPlacing(false)
      Alert.alert('Error', orderError?.message ?? 'Failed to create order.')
      return
    }

    await supabase.from('order_items').insert({
      order_id: order.id,
      name: selectedDisease,
      qty: 1,
      price,
      product_id: selectedDuration,
    })

    await supabase.from('payments').insert({
      order_id: order.id,
      patient_id: profile.id,
      amount: price,
      provider: selectedPayment,
      status: 'completed',
    })

    setPlacing(false)
    Alert.alert('Order Placed!', `Your order #${order.id} has been placed successfully.`, [
      { text: 'OK', onPress: () => router.back() },
    ])
  }

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16)
    return cleaned.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4)
    if (cleaned.length > 2) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`
    return cleaned
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Place Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Condition Selector */}
          <Text style={styles.sectionTitle}>Lifestyle Condition</Text>
          <Pressable
            style={[styles.dropdown, errors.disease && styles.fieldError]}
            onPress={() => setShowDiseaseModal(true)}
          >
            <Text style={[styles.dropdownText, !selectedDisease && { color: '#9CA3AF' }]}>
              {selectedDisease ?? 'Select a condition'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={24} color="#6B7280" />
          </Pressable>
          {errors.disease && <Text style={styles.errorText}>Please select a condition</Text>}

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your symptoms, current medications, or any specific requirements..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          {/* Duration */}
          <Text style={styles.sectionTitle}>Treatment Duration</Text>
          <View style={styles.durationGrid}>
            {DURATIONS.map((d) => {
              const isActive = selectedDuration === d.key
              const durationPrice = fees[d.key] ?? 0
              return (
                <Pressable
                  key={d.key}
                  style={[styles.durationCard, isActive && styles.durationActive]}
                  onPress={() => setSelectedDuration(d.key)}
                >
                  <Text style={styles.durationLabel}>{d.label}</Text>
                  <Text style={styles.durationPrice}>₹{durationPrice}</Text>
                </Pressable>
              )
            })}
          </View>
          {errors.duration && <Text style={[styles.errorText, { marginTop: -10 }]}>Please select a duration</Text>}

          {/* Delivery Address */}
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <TextInput
            style={[styles.input, styles.addressInput, errors.address && styles.fieldError]}
            placeholder="Enter your delivery address"
            placeholderTextColor="#9CA3AF"
            value={address}
            onChangeText={setAddress}
            multiline
            textAlignVertical="top"
          />
          {errors.address && <Text style={[styles.errorText, { marginTop: -12 }]}>Please enter a delivery address</Text>}

          {/* Payment Method */}
          <Text style={styles.sectionTitle}>Payment Method</Text>

          {/* UPI Apps */}
          <Text style={styles.subLabel}>UPI</Text>
          <View style={styles.paymentGrid}>
            {UPI_PAYMENT_METHODS.map((method) => {
              const isActive = selectedPayment === method.id
              return (
                <Pressable
                  key={method.id}
                  style={[styles.paymentCard, isActive && styles.paymentActive]}
                  onPress={() => setSelectedPayment(method.id)}
                >
                  <Image source={method.image} style={styles.paymentLogo} resizeMode="contain" />
                  <Text style={styles.paymentLabel}>{method.label}</Text>
                </Pressable>
              )
            })}
          </View>

          {/* Card Option */}
          <Text style={styles.subLabel}>Card</Text>
          <Pressable
            style={[styles.cardOption, selectedPayment === 'card' && styles.cardOptionActive]}
            onPress={() => setSelectedPayment('card')}
          >
            <MaterialIcons name="credit-card" size={24} color={selectedPayment === 'card' ? BLUE : '#6B7280'} />
            <Text style={styles.cardOptionText}>Credit / Debit Card</Text>
          </Pressable>
          {errors.payment && <Text style={styles.errorText}>Please select a payment method</Text>}

          {selectedPayment === 'card' && (
            <View style={styles.cardForm}>
              <TextInput
                style={[styles.cardInput, errors.cardNumber && styles.fieldError]}
                placeholder="Card Number"
                placeholderTextColor="#9CA3AF"
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                keyboardType="number-pad"
                maxLength={19}
              />
              {errors.cardNumber && <Text style={styles.errorText}>Enter a valid 16-digit card number</Text>}
              <TextInput
                style={[styles.cardInput, errors.cardName && styles.fieldError]}
                placeholder="Cardholder Name"
                placeholderTextColor="#9CA3AF"
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="characters"
              />
              {errors.cardName && <Text style={styles.errorText}>Enter the cardholder name</Text>}
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.cardInput, errors.cardExpiry && styles.fieldError]}
                    placeholder="MM/YY"
                    placeholderTextColor="#9CA3AF"
                    value={cardExpiry}
                    onChangeText={(t) => setCardExpiry(formatExpiry(t))}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                  {errors.cardExpiry && <Text style={styles.errorText}>Invalid expiry</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.cardInput, errors.cardCvv && styles.fieldError]}
                    placeholder="CVV"
                    placeholderTextColor="#9CA3AF"
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                  {errors.cardCvv && <Text style={styles.errorText}>Invalid CVV</Text>}
                </View>
              </View>
            </View>
          )}

          {/* Summary */}
          <View style={styles.summaryCard}>
            {selectedDisease && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Condition</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>{selectedDisease}</Text>
              </View>
            )}
            {selectedDuration && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>
                  {DURATIONS.find((d) => d.key === selectedDuration)?.label}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{price.toFixed(2)}</Text>
            </View>
          </View>

          <Pressable
            style={[styles.placeBtn, placing && { opacity: 0.6 }]}
            onPress={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="shopping-cart" size={20} color="#fff" />
                <Text style={styles.placeBtnText}>Place Order • ₹{price.toFixed(2)}</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Disease Picker Modal */}
      <Modal visible={showDiseaseModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Condition</Text>
              <Pressable onPress={() => setShowDiseaseModal(false)}>
                <MaterialIcons name="close" size={24} color="#1A1A2E" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {DISEASES.map((disease) => {
                const isActive = selectedDisease === disease
                return (
                  <Pressable
                    key={disease}
                    style={[styles.modalItem, isActive && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedDisease(disease)
                      setShowDiseaseModal(false)
                    }}
                  >
                    <Text style={[styles.modalItemText, isActive && styles.modalItemTextActive]}>
                      {disease}
                    </Text>
                    {isActive && <MaterialIcons name="check" size={20} color={BLUE} />}
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 10,
    marginTop: 8,
  },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 18,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1A1A2E',
    flex: 1,
  },

  // Input
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
    backgroundColor: '#fff',
    marginBottom: 18,
  },
  textArea: {
    minHeight: 100,
  },
  addressInput: {
    minHeight: 70,
  },

  // Duration
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  durationCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  durationActive: {
    borderColor: BLUE,
  },
  durationLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  durationPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 4,
  },

  // Payment
  paymentGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  paymentActive: {
    borderColor: BLUE,
  },
  paymentLogo: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardOptionActive: {
    borderColor: BLUE,
  },
  cardOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  cardForm: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
    backgroundColor: '#FAFAFA',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Summary
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
  },

  // Place Button
  placeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 10,
  },
  placeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  modalItemActive: {
    backgroundColor: BLUE + '08',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  modalItemText: {
    fontSize: 15,
    color: '#374151',
  },
  modalItemTextActive: {
    color: BLUE,
    fontWeight: '600',
  },
  fieldError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 2,
  },
})
