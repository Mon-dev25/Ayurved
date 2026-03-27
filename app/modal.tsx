import { signInWithProvider } from '@/lib/social-auth'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { type UserRole } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase.web'

const TINT = '#6050D0'
const BG = '#E8EAF6'

type Mode = 'signin' | 'signup'

export default function ModalScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('patient')
  const [loading, setLoading] = useState(false)

  const resetFields = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    setRole('patient')
  }

  const toggleMode = () => {
    resetFields()
    setMode(mode === 'signin' ? 'signup' : 'signin')
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      Alert.alert('Sign In Failed', error.message)
    }
  }

     const handleSocialAuth = async (provider: 'google' | 'facebook' | 'twitter') => {
  try {
    setLoading(true)
    const session = await signInWithProvider(provider)
    if (!session) {
      Alert.alert('Cancelled', 'Sign in was cancelled.')
    }
  } catch (err: any) {
    Alert.alert('Auth Failed', err.message ?? 'Something went wrong.')
  } finally {
    setLoading(false)
  }
}


  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all required fields.')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || undefined, role } },
    })

    if (error) {
      setLoading(false)
      Alert.alert('Sign Up Failed', error.message)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        role,
        full_name: fullName || null,
      })
      if (profileError) {
        console.warn('Failed to create profile:', profileError.message)
      }

      if (role === 'doctor') {
        const { error: doctorError } = await supabase.from('doctors').upsert({
          id: data.user.id,
        })
        if (doctorError) {
          console.warn('Failed to create doctor row:', doctorError.message)
        }
      }

      if (role === 'patient') {
        const { error: patientError } = await supabase.from('patients').upsert({
          id: data.user.id,
        })
        if (patientError) {
          console.warn('Failed to create patient row:', patientError.message)
        }
      }
    }

    setLoading(false)

    if (data.session) {
      resetFields()
    } else {
      Alert.alert(
        'Check your email',
        'A confirmation link has been sent to your email address.',
      )
      resetFields()
    }
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button — only on signup */}
          {mode === 'signup' && (
            <Pressable onPress={toggleMode} style={styles.backBtn} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
            </Pressable>
          )}

          {/* Logo */}
          <View style={styles.logoWrap}>
            {/*
              Replace the source below with your actual logo asset, e.g.:
              <Image source={require('@/assets/images/cignifi-logo.png')} style={styles.logo} resizeMode="contain" />
            */}
            <Text style={styles.logoText}>AYUR</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {mode === 'signin' ? 'Login to your Account' : 'Create your Account'}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {mode === 'signup' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoComplete="name"
                />

                <View style={styles.roleRow}>
                  <Pressable
                    style={[styles.roleOption, role === 'patient' && styles.roleOptionActive]}
                    onPress={() => setRole('patient')}
                  >
                    <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>
                      Patient
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.roleOption, role === 'doctor' && styles.roleOptionActive]}
                    onPress={() => setRole('doctor')}
                  >
                    <Text style={[styles.roleText, role === 'doctor' && styles.roleTextActive]}>
                      Doctor
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              textContentType={mode === 'signin' ? 'password' : 'newPassword'}
            />

            {mode === 'signup' && (
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
              />
            )}

            <Pressable
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={mode === 'signin' ? handleSignIn : handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === 'signin' ? 'Sign in' : 'Sign up'}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>
              {mode === 'signin' ? '- Or sign in with -' : '- Or sign up with -'}
            </Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <Pressable style={styles.socialBtn} onPress={() => handleSocialAuth('google')}>
              <Text style={styles.socialIcon}>G</Text>
            </Pressable>
            <Pressable style={styles.socialBtn} onPress={() => handleSocialAuth('facebook')}>
              <Text style={[styles.socialIcon, { color: '#1877F2' }]}>f</Text>
            </Pressable>
            <Pressable style={styles.socialBtn} onPress={() => handleSocialAuth('twitter')}>
              <Text style={[styles.socialIcon, { color: '#1DA1F2' }]}>𝕏</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {mode === 'signin'
                ? "Don't have an account? "
                : 'Already have an account? '}
            </Text>
            <Pressable onPress={toggleMode}>
              <Text style={styles.footerLink}>
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },

  logoWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 160,
    height: 60,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: TINT,
    letterSpacing: 1,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 24,
  },

  form: {
    gap: 14,
    marginBottom: 28,
  },
  input: {
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  roleOptionActive: {
    borderColor: TINT,
    backgroundColor: TINT + '12',
  },
  roleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  roleTextActive: {
    color: TINT,
    fontWeight: '600',
  },

  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TINT,
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C4C4C4',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#9CA3AF',
  },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 32,
  },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#EA4335',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: TINT,
    textDecorationLine: 'underline',
  },
})