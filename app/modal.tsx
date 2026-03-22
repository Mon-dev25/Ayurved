import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { type UserRole } from '@/hooks/use-auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { supabase } from '@/lib/supabase.web';

type Mode = 'signin' | 'signup';

export default function ModalScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [loading, setLoading] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const bgColor = useThemeColor({}, 'background');

  const resetFields = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setRole('patient');
  };

  const toggleMode = () => {
    resetFields();
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Sign In Failed', error.message);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || undefined, role } },
    });

    if (error) {
      setLoading(false);
      Alert.alert('Sign Up Failed', error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        role,
        full_name: fullName || null,
      });
      if (profileError) {
        console.warn('Failed to create profile:', profileError.message);
      }

      if (role === 'doctor') {
        const { error: doctorError } = await supabase.from('doctors').upsert({
          id: data.user.id,
        });
        if (doctorError) {
          console.warn('Failed to create doctor row:', doctorError.message);
        }
      }

      if (role === 'patient') {
        const { error: patientError } = await supabase.from('patients').upsert({
          id: data.user.id,
        });
        if (patientError) {
          console.warn('Failed to create patient row:', patientError.message);
        }
      }
    }

    setLoading(false);

    if (data.session) {
      resetFields();
    } else {
      Alert.alert(
        'Check your email',
        'A confirmation link has been sent to your email address.',
      );
      resetFields();
    }
  };

  const inputStyle = [
    styles.input,
    {
      color: textColor,
      borderColor: iconColor,
      backgroundColor: bgColor,
    },
  ];

  return (
    <ThemedView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <ThemedText type="title" style={styles.brand}>
              Ayur
            </ThemedText>
            <ThemedText style={styles.tagline}>
              Your wellness journey starts here
            </ThemedText>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tab,
                mode === 'signin' && { borderBottomColor: tintColor, borderBottomWidth: 2 },
              ]}
              onPress={() => { if (mode !== 'signin') toggleMode(); }}
            >
              <ThemedText
                type={mode === 'signin' ? 'defaultSemiBold' : 'default'}
                style={mode !== 'signin' ? { opacity: 0.5 } : undefined}
              >
                Sign In
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                mode === 'signup' && { borderBottomColor: tintColor, borderBottomWidth: 2 },
              ]}
              onPress={() => { if (mode !== 'signup') toggleMode(); }}
            >
              <ThemedText
                type={mode === 'signup' ? 'defaultSemiBold' : 'default'}
                style={mode !== 'signup' ? { opacity: 0.5 } : undefined}
              >
                Sign Up
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View
              style={mode === 'signin' ? styles.hiddenField : undefined}
              pointerEvents={mode === 'signin' ? 'none' : 'auto'}
            >
              <TextInput
                style={inputStyle}
                placeholder="Full Name"
                placeholderTextColor={iconColor}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

            <View
              style={mode === 'signin' ? styles.hiddenField : undefined}
              pointerEvents={mode === 'signin' ? 'none' : 'auto'}
            >
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    { borderColor: iconColor },
                    role === 'patient' && { borderColor: tintColor, backgroundColor: tintColor + '18' },
                  ]}
                  onPress={() => setRole('patient')}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    type={role === 'patient' ? 'defaultSemiBold' : 'default'}
                    style={role !== 'patient' ? { opacity: 0.5 } : undefined}
                  >
                    Patient
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    { borderColor: iconColor },
                    role === 'doctor' && { borderColor: tintColor, backgroundColor: tintColor + '18' },
                  ]}
                  onPress={() => setRole('doctor')}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    type={role === 'doctor' ? 'defaultSemiBold' : 'default'}
                    style={role !== 'doctor' ? { opacity: 0.5 } : undefined}
                  >
                    Doctor
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={inputStyle}
              placeholder="Email"
              placeholderTextColor={iconColor}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
            />

            <TextInput
              style={inputStyle}
              placeholder="Password"
              placeholderTextColor={iconColor}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              textContentType={mode === 'signin' ? 'password' : 'newPassword'}
            />

            <View
              style={mode === 'signin' ? styles.hiddenField : undefined}
              pointerEvents={mode === 'signin' ? 'none' : 'auto'}
            >
              <TextInput
                style={inputStyle}
                placeholder="Confirm Password"
                placeholderTextColor={iconColor}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor }]}
              onPress={mode === 'signin' ? handleSignIn : handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText
                  type="defaultSemiBold"
                  lightColor="#fff"
                  darkColor="#11181C"
                  style={styles.buttonText}
                >
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              {mode === 'signin'
                ? "Don't have an account?"
                : 'Already have an account?'}
            </ThemedText>
            <TouchableOpacity onPress={toggleMode}>
              <ThemedText type="link">
                {mode === 'signin' ? ' Sign Up' : ' Sign In'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brand: {
    fontSize: 42,
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    opacity: 0.6,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
  },
  form: {
    gap: 14,
    marginBottom: 28,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenField: {
    opacity: 0,
  },
  footerText: {
    opacity: 0.6,
  },
});
