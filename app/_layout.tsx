import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'

import { SplashScreenController } from '@/components/splash-screen-controller'

import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import AuthProvider from '@/providers/auth-providers'
import DoctorProvider from '@/providers/doctor-provider'

function RootNavigator() {
  const { isLoggedIn, role } = useAuthContext()

  return (
    <Stack>
      <Stack.Protected guard={isLoggedIn && role === 'patient'}>
        <Stack.Screen name="(patient-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="schedule" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="appointment-history" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="change-password" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="privacy-settings" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="doctors" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="place-order" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="articles" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="article-detail" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="consult" options={{ headerShown: false, presentation: 'card' }} />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn && role === 'doctor'}>
        <Stack.Screen name="(doctor-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="manage-slots" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="manage-pricing" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="doctor-appointments" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="change-password-doc" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="privacy-settings-doc" options={{ headerShown: false, presentation: 'card' }} />
      </Stack.Protected>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="help-support" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, presentation: 'card' }} />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="modal" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  )
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <DoctorProvider>
          <SplashScreenController />
          <RootNavigator />
          <StatusBar style="auto" />
        </DoctorProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}