import { StyleSheet } from 'react-native'

import SignOutButton from '@/components/social-auth-buttons/sign-out-button'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useAuthContext } from '@/hooks/use-auth-context'

export default function DoctorHomeScreen() {
  const { profile } = useAuthContext()

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome, Dr. {profile?.full_name ?? 'Doctor'}</ThemedText>
      <ThemedText style={styles.subtitle}>Your dashboard</ThemedText>
      <SignOutButton />
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  subtitle: {
    opacity: 0.6,
    fontSize: 16,
  },
})
