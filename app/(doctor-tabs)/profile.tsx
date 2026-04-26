import MaterialIcons from '@expo/vector-icons/MaterialIcons'
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { getFeatureDeckApiKey } from '@/lib/featuredeck-config'
import { supabase } from '@/lib/supabase.web'
import { FeatureDeck } from '@featuredeck/react-native'

const BLUE = '#6050D0'

type MenuItem = {
  key: string
  icon: React.ComponentProps<typeof MaterialIcons>['name']
  label: string
  route?: string
  action?: () => void
}

const ACCOUNT_ITEMS: MenuItem[] = [
  { key: 'slots', icon: 'event-available', label: 'Manage Availability', route: '/manage-slots' },
  { key: 'pricing', icon: 'attach-money', label: 'Medicine Pricing', route: '/manage-pricing' },
  { key: 'appointments', icon: 'history', label: 'Appointment History', route: '/doctor-appointments' },
]

const SETTING_ITEMS: MenuItem[] = [
  { key: 'password', icon: 'lock-outline', label: 'Login & Password', route: '/change-password-doc' },
  { key: 'privacy', icon: 'shield', label: 'Privacy Settings', route: '/privacy-settings-doc' },
  { key: 'help', icon: 'help-outline', label: 'Help & Support', route: '/help-support' },
  ...(getFeatureDeckApiKey()
    ? [
        {
          key: 'featuredeck',
          icon: 'lightbulb-outline' as const,
          label: 'Feature requests & roadmap',
          action: () => FeatureDeck.openFeatureBoard(),
        },
      ]
    : []),
]

export default function DoctorProfileScreen() {
  const { profile, refreshProfile } = useAuthContext()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [logoutVisible, setLogoutVisible] = useState(false)

  const handleEdit = () => {
    setFullName(profile?.full_name ?? '')
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
  }

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.')
      return
    }
    if (!profile?.id) return

    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', profile.id)
    setSaving(false)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    await refreshProfile?.()
    setEditing(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    router.replace('/modal')
  }

  const renderItem = (item: MenuItem, index: number, arr: MenuItem[]) => (
    <Pressable
      key={item.key}
      style={[styles.menuRow, index === arr.length - 1 && styles.menuRowLast]}
      onPress={() => {
        if (item.action) item.action()
        else if (item.route) router.navigate(item.route as any)
      }}
    >
      <View style={styles.menuLeft}>
        <View style={styles.menuIconWrap}>
          <MaterialIcons name={item.icon} size={20} color={BLUE} />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color="#C4C4C4" />
    </Pressable>
  )

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Pressable style={styles.notifBtn} onPress={() => router.navigate('/notifications')}>
            <MaterialIcons name="notifications-none" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={36} color={BLUE} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{profile?.full_name ?? 'Doctor'}</Text>
            <Text style={styles.userEmail}>{profile?.email ?? profile?.username ?? ''}</Text>
          </View>
          {!editing && (
            <Pressable style={styles.editBtn} onPress={handleEdit}>
              <MaterialIcons name="edit" size={15} color='#FFFFFF' />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {editing && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Edit Profile</Text>
              <View style={styles.formCard}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
                <View style={styles.formActions}>
                  <Pressable style={styles.cancelBtn} onPress={handleCancel}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveText}>Save Changes</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              {ACCOUNT_ITEMS.map((item, i, arr) => renderItem(item, i, arr))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.card}>
              {SETTING_ITEMS.map((item, i, arr) => renderItem(item, i, arr))}
            </View>
          </View>

          <Pressable style={styles.signOutBtn} onPress={() => setLogoutVisible(true)}>
            <MaterialIcons name="logout" size={18} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={logoutVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <MaterialIcons name="logout" size={32} color="#EF4444" />
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMsg}>Are you sure you want to sign out?</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setLogoutVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={handleSignOut}>
                <Text style={styles.modalConfirmText}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BLUE,
  },
  header: {
    backgroundColor: BLUE,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0E0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  editText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  // Edit form
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
    backgroundColor: '#FAFAFA',
    marginBottom: 14,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: BLUE,
  },
  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 4,
  },
  modalMsg: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
})