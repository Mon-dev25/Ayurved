import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import RazorpayCheckout from 'react-native-razorpay'
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
  const [placing, setPlacing] = useState(false)
  const [attempted, setAttempted] = useState(false)

  const errors = {
    disease: attempted && !selectedDisease,
    duration: attempted && !selectedDuration,
    address: attempted && !address.trim(),
  }

  const fees = selectedDoctor?.medicine_price ?? DEFAULT_PRICING
  const price = selectedDuration ? (fees[selectedDuration] ?? 0) : 0

  const handlePlaceOrder = async () => {
    setAttempted(true)

    if (!selectedDisease || !selectedDuration || !address.trim()) return
    if (!profile?.id) return

    setPlacing(true)

    try {
      // Step 1 — Create Razorpay order
      const response = await fetch('http://localhost:8081/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price * 100 }), // ₹ to paise
      })

      if (!response.ok) throw new Error('Failed to create payment order')

      const { orderId, amount, currency, keyId } = await response.json()

      // Step 2 — Open Razorpay (handles UPI, Cards, Netbanking etc. natively)
      const paymentData = await RazorpayCheckout.open({
        description: `Ayur Consultation - ${selectedDisease}`,
        currency,
        key: keyId,
        amount,
        order_id: orderId,
        name: 'Ayur Wellness',
        prefill: {
          email: profile.email ?? 'patient@example.com',
          contact: profile.phone ?? '9999999999',
          name: profile.full_name ?? 'Patient',
        },
        theme: { color: BLUE },
      })

      // Step 3 — Save to Supabase only after successful payment
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

      if (orderError || !order) throw new Error(orderError?.message ?? 'Failed to create order')

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
        provider: 'razorpay',
        status: 'completed',
        razorpay_payment_id: paymentData.razorpay_payment_id,
      })

      Alert.alert(
        'Order Placed!',
        `Your order #${order.id} has been placed successfully.`,
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (error: any) {
      if (error.description) {
        Alert.alert('Payment Failed', error.description)
      } else {
        Alert.alert('Error', error.message ?? 'Something went wrong')
      }
    } finally {
      setPlacing(false)
    }
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
          {errors.duration && (
            <Text style={[styles.errorText, { marginTop: -10 }]}>Please select a duration</Text>
          )}

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
          {errors.address && (
            <Text style={[styles.errorText, { marginTop: -12 }]}>Please enter a delivery address</Text>
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