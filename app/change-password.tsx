import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '@/lib/supabase.web'

const BLUE = '#6050D0'

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [secureNew, setSecureNew] = useState(true)
  const [secureConfirm, setSecureConfirm] = useState(true)

  const handleSave = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in both fields.')
      return
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) {
      Alert.alert('Failed', error.message)
      return
    }

    Alert.alert('Success', 'Your password has been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ])
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Login & Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            placeholderTextColor="#9CA3AF"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={secureNew}
            autoComplete="new-password"
          />
          <Pressable onPress={() => setSecureNew(!secureNew)} style={styles.eyeBtn}>
            <MaterialIcons name={secureNew ? 'visibility-off' : 'visibility'} size={22} color="#9CA3AF" />
          </Pressable>
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Confirm Password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#9CA3AF"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureConfirm}
            autoComplete="new-password"
          />
          <Pressable onPress={() => setSecureConfirm(!secureConfirm)} style={styles.eyeBtn}>
            <MaterialIcons name={secureConfirm ? 'visibility-off' : 'visibility'} size={22} color="#9CA3AF" />
          </Pressable>
        </View>

        <Pressable
          style={[styles.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Update Password</Text>
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
    paddingTop: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: '#1A1A2E',
  },
  eyeBtn: {
    padding: 6,
  },
  saveBtn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
