import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TINT = '#6050D0'

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.empty}>
        <MaterialIcons name="notifications-none" size={56} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptySub}>You'll see updates and reminders here</Text>
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
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#9CA3AF',
  },
})
