import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'

const TINT = '#6050D0'

const SERVICES = [
  {
    key: 'slots',
    icon: 'event-available' as const,
    label: 'Manage\nAvailability',
    route: '/manage-slots',
    color: '#E8F5E9',
    iconColor: '#43A047',
  },
  {
    key: 'pricing',
    icon: 'attach-money' as const,
    label: 'Medicine\nPricing',
    route: '/manage-pricing',
    color: '#FFF8E1',
    iconColor: '#F9A825',
  },
  {
    key: 'article',
    icon: 'edit-note' as const,
    label: 'Post\nArticle',
    route: '/posts',
    color: '#E3F2FD',
    iconColor: '#1E88E5',
  },
  {
    key: 'appointments',
    icon: 'calendar-today' as const,
    label: 'View\nAppointments',
    route: '/doctor-appointments',
    color: '#FCE4EC',
    iconColor: TINT,
  },
]

const QUICK_STATS = [
  { label: "Today's Appts", value: '0', icon: 'today' as const },
  { label: 'Total Patients', value: '0', icon: 'people' as const },
  { label: 'Pending Orders', value: '0', icon: 'pending-actions' as const },
]

export default function DoctorHomeScreen() {
  const { profile } = useAuthContext()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.hello}>Hello,</Text>
              <Text style={styles.doctorName}>
                Dr. {profile?.full_name ?? 'Doctor'} 👋
              </Text>
            </View>
            <Pressable
              style={styles.notifBtn}
              onPress={() => router.navigate('/notifications')}
            >
              <MaterialIcons name="notifications-none" size={24} color="#1A1A2E" />
            </Pressable>
          </View>

          {/* Stats card */}
          <View style={styles.statsCard}>
            {QUICK_STATS.map((stat, i) => (
              <View
                key={stat.label}
                style={[styles.statItem, i < QUICK_STATS.length - 1 && styles.statBorder]}
              >
                <MaterialIcons name={stat.icon} size={20} color={TINT} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.servicesGrid}>
            {SERVICES.map((s) => (
              <Pressable
                key={s.key}
                style={styles.serviceCard}
                onPress={() => router.navigate(s.route as any)}
              >
                <View style={[styles.serviceIcon, { backgroundColor: s.color }]}>
                  <MaterialIcons name={s.icon} size={28} color={s.iconColor} />
                </View>
                <Text style={styles.serviceLabel}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Upcoming appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <Pressable onPress={() => router.navigate('/doctor-appointments' as any)}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <View style={styles.emptyCard}>
            <MaterialIcons name="event-busy" size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No upcoming appointments</Text>
            <Text style={styles.emptySub}>New bookings will appear here</Text>
          </View>
        </View>

        {/* Recent orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Medicine Orders</Text>
            <Pressable>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <View style={styles.emptyCard}>
            <MaterialIcons name="shopping-bag" size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No recent orders</Text>
            <Text style={styles.emptySub}>Patient medicine orders will appear here</Text>
          </View>
        </View>

        {/* Post article CTA */}
        {/* <View style={styles.section}>
          <Pressable
            style={styles.articleCta}
            onPress={() => router.navigate('/post-article' as any)}
          >
            <View>
              <Text style={styles.articleCtaTitle}>Share Your Knowledge</Text>
              <Text style={styles.articleCtaSub}>Post an article for your patients</Text>
            </View>
            <View style={styles.articleCtaBtn}>
              <MaterialIcons name="edit" size={20} color="#fff" />
            </View>
          </Pressable>
        </View> */}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  hello: {
    fontSize: 16,
    color: '#6B7280',
  },
  doctorName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: TINT,
    borderRadius: 16,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(255,255,255,0.3)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  seeAll: {
    color: TINT,
    fontWeight: '600',
    fontSize: 14,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '22%',
    alignItems: 'center',
    gap: 8,
  },
  serviceIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 15,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  articleCta: {
    backgroundColor: TINT,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  articleCtaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  articleCtaSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  articleCtaBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})