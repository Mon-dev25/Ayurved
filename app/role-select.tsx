import { MaterialIcons } from '@expo/vector-icons'
import { useState } from 'react'
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase.web'

const BLUE = '#6050D0'

export default function RoleSelectScreen() {
  const insets = useSafeAreaInsets()
  const { claims, refreshProfile } = useAuthContext()
  const [saving, setSaving] = useState(false)

const handleRoleSelect = async (role: 'patient' | 'doctor') => {
  const userId = claims?.sub
  console.log("🚀 ~ handleRoleSelect ~ claims:", claims)
  console.log('🎭 userId:', userId)
  if (!userId) return

  setSaving(true)

  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({ id: userId, role })

  console.log('🎭 upsert result:', { upsertError })

  if (role === 'doctor') {
    const { error: docError } = await supabase.from('doctors').upsert({ id: userId })
    console.log('🎭 doctors upsert:', { docError })
  } else {
    const { error: patError } = await supabase.from('patients').upsert({ id: userId })
    console.log('🎭 patients upsert:', { patError })
  }

  console.log('🎭 calling refreshProfile...')
  await refreshProfile()
  console.log('🎭 refreshProfile done')

  setSaving(false)
}

  return (
    <View style={[styles.root, { paddingTop: insets.top + 60 }]}>
      <Text style={styles.title}>One last step!</Text>
      <Text style={styles.subtitle}>How would you like to use Ayur Wellness?</Text>

      <View style={styles.cards}>
        <Pressable
          style={styles.roleCard}
          onPress={() => handleRoleSelect('patient')}
          disabled={saving}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
            <MaterialIcons name="person" size={36} color={BLUE} />
          </View>
          <View style={styles.roleInfo}>
            <Text style={styles.roleTitle}>I'm a Patient</Text>
            <Text style={styles.roleDesc}>
              Book consultations, order medicines, and track your wellness
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#D1D5DB" />
        </Pressable>

        <Pressable
          style={styles.roleCard}
          onPress={() => handleRoleSelect('doctor')}
          disabled={saving}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
            <MaterialIcons name="medical-services" size={36} color="#059669" />
          </View>
          <View style={styles.roleInfo}>
            <Text style={styles.roleTitle}>I'm a Doctor</Text>
            <Text style={styles.roleDesc}>
              Manage appointments, prescribe treatments, and help patients
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#D1D5DB" />
        </Pressable>
      </View>

      {saving && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Setting up your account...</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA', paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 48 },
  cards: { gap: 16 },
  roleCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  roleInfo: { flex: 1, marginLeft: 16 },
  roleTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  roleDesc: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 15, color: '#6B7280' },
})