import { useAuthContext } from '@/hooks/use-auth-context'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TINT = '#6050D0'

export default function AuthCallback() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isLoading, isLoggedIn, role, profileLoaded } = useAuthContext()

  const ready = !isLoading && (!isLoggedIn || profileLoaded)

  useEffect(() => {
    if (!ready) return

    if (!isLoggedIn) {
      router.replace('/modal')
      return
    }

    if (!role) {
      router.replace('/role-select')
      return
    }

    router.replace(role === 'patient' ? '/(patient-tabs)' : '/(doctor-tabs)')
  }, [ready, isLoggedIn, role, router])

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={TINT} />
        <Text style={styles.title}>Signing you in…</Text>
        <Text style={styles.sub}>Please wait a moment.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EAF6', paddingHorizontal: 24 },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: { marginTop: 12, fontSize: 18, fontWeight: '800', color: '#111827' },
  sub: { marginTop: 6, fontSize: 13, color: '#6B7280' },
})

