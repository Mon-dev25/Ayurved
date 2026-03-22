import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { DEFAULT_PRICING } from '@/hooks/use-doctor-context'
import { supabase } from '@/lib/supabase.web'

const BLUE = '#6050D0'

const DURATION_LABELS: Record<string, string> = {
  '7_days': '7 Days',
  '15_days': '15 Days',
  '1_month': '1 Month',
  '2_months': '2 Months',
}

const DURATION_KEYS = ['7_days', '15_days', '1_month', '2_months'] as const

export default function ManagePricingScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { profile } = useAuthContext()
  const [fees, setFees] = useState({ ...DEFAULT_PRICING })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    const fetch = async () => {
      const { data } = await supabase
        .from('doctors')
        .select('medicine_price')
        .eq('id', profile.id)
        .single()

      if (data?.medicine_price) {
        setFees({ ...DEFAULT_PRICING, ...data.medicine_price })
      }
      setLoading(false)
    }
    fetch()
  }, [profile?.id])

  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true)

    const { error } = await supabase
      .from('doctors')
      .update({ medicine_price: fees })
      .eq('id', profile.id)

    setSaving(false)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    Alert.alert('Saved', 'Your medicine pricing has been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ])
  }

  const updateFee = (key: string, value: string) => {
    setFees((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }))
  }

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={BLUE} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Medicine Pricing</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Set your medicine pricing for each treatment duration. Patients will see these prices when placing orders.
        </Text>

        {DURATION_KEYS.map((key) => (
          <View key={key} style={styles.feeRow}>
            <View style={styles.feeInfo}>
              <Text style={styles.feeLabel}>{DURATION_LABELS[key]}</Text>
            </View>
            <View style={styles.feeInputWrap}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.feeInput}
                value={fees[key] > 0 ? String(fees[key]) : ''}
                onChangeText={(v) => updateFee(key, v)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        ))}

        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Pricing</Text>
          )}
        </Pressable>
      </View>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 24,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  feeInfo: {
    flex: 1,
  },
  feeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  feeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    width: 120,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginRight: 4,
  },
  feeInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  saveBtn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
