import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const BLUE = '#6050D0'

type ToggleItem = {
  key: string
  icon: React.ComponentProps<typeof MaterialIcons>['name']
  label: string
  description: string
}

const PRIVACY_ITEMS: ToggleItem[] = [
  {
    key: 'profile_visible',
    icon: 'visibility',
    label: 'Profile Visibility',
    description: 'Allow the doctor to view your profile details',
  },
  {
    key: 'share_medical',
    icon: 'description',
    label: 'Share Medical Data',
    description: 'Share your medical history with the doctor',
  },
  {
    key: 'notifications',
    icon: 'notifications',
    label: 'Push Notifications',
    description: 'Receive appointment reminders and updates',
  },
  {
    key: 'email_updates',
    icon: 'email',
    label: 'Email Updates',
    description: 'Receive health tips and news via email',
  },
]

export default function PrivacySettingsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    profile_visible: true,
    share_medical: true,
    notifications: true,
    email_updates: false,
  })

  const toggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          {PRIVACY_ITEMS.map((item, idx) => (
            <View
              key={item.key}
              style={[
                styles.row,
                idx < PRIVACY_ITEMS.length - 1 && styles.rowBorder,
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={styles.iconWrap}>
                  <MaterialIcons name={item.icon} size={22} color={BLUE} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowDesc}>{item.description}</Text>
                </View>
              </View>
              <Switch
                value={toggles[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={toggles[item.key] ? BLUE : '#f4f3f4'}
              />
            </View>
          ))}
        </View>

        <Text style={styles.footerNote}>
          These preferences are stored locally and can be changed at any time.
        </Text>
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
    paddingTop: 20,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  rowDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  footerNote: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
})
