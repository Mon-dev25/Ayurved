import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'

import { useAuthContext } from '@/hooks/use-auth-context'

export default function Index() {
  const { isLoggedIn, role, isLoading, profileLoaded } = useAuthContext()

  if (isLoading || (isLoggedIn && !profileLoaded)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <ActivityIndicator size="large" color="#6050D0" />
      </View>
    )
  }

  if (!isLoggedIn) return <Redirect href="/modal" />
  if (!role) return <Redirect href="/role-select" />
  if (role === 'doctor') return <Redirect href="/(doctor-tabs)" />
  return <Redirect href="/(patient-tabs)" />
}
