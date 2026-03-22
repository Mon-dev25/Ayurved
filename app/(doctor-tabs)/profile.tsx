import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase.web'

const BLUE = '#6050D0'

type MenuItem = {
  key: string
  icon: React.ComponentProps<typeof MaterialIcons>['name']
  label: string
  route?: string
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
]

export default function DoctorProfileScreen() {
  const { profile } = useAuthContext()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    router.replace('/modal')
  }

  const renderItem = (item: MenuItem) => (
    <Pressable
      key={item.key}
      style={styles.menuRow}
      onPress={() => item.route && router.navigate(item.route as any)}
    >
      <View style={styles.menuLeft}>
        <View style={styles.menuIconWrap}>
          <MaterialIcons name={item.icon} size={22} color={BLUE} />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color="#C4C4C4" />
    </Pressable>
  )

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerWrap, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerGradient}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>My Profile</Text>
              <Pressable style={styles.notifBtn} onPress={() => router.navigate('/notifications')}>
                <MaterialIcons name="notifications-none" size={24} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <MaterialIcons name="person" size={40} color={BLUE} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{profile?.full_name ?? 'Doctor'}</Text>
              <Text style={styles.userEmail}>{profile?.email ?? profile?.username ?? ''}</Text>
            </View>
            <Pressable style={styles.editBtn}>
              <MaterialIcons name="edit" size={16} color={BLUE} />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            {ACCOUNT_ITEMS.map(renderItem)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Setting</Text>
          <View style={styles.card}>
            {SETTING_ITEMS.map(renderItem)}
          </View>
        </View>

        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerWrap: {
    backgroundColor: BLUE,
    paddingBottom: 50,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerGradient: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRow: {
    alignItems: 'flex-start',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  nameSection: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 28,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E0E0F0',
  },
  editText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 10,
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
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
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
    marginTop: 4,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
})
