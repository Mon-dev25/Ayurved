import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase.web'
import { useEffect, useState } from 'react'

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
  const [nextAppointment, setNextAppointment] = useState<any>(null)
  const [recentOrder, setRecentOrder] = useState<any>(null)

  useEffect(() => {
  if (!profile?.id) return
  const fetchRecentOrder = async () => {
    const { data: order } = await supabase
      .from('orders')
      .select('id, patient_id, total, status, created_at, order_items(name, qty, price)')
      .eq('doctor_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (!order) return
    // Fetch patient name — adjust table if patients != profiles
    const { data: patient } = await supabase
      .from('patients')
      .select('full_name, phone')
      .eq('id', order.patient_id)
      .single()
    setRecentOrder({ ...order, patient })
  }
  fetchRecentOrder()
}, [profile?.id])
  
  useEffect(() => {
  if (!profile?.id) return
  const fetchNext = async () => {
  const { data: appointment } = await supabase
  .from('appointments')
  .select('id, patient_id, scheduled_at, status, notes')
  .eq('doctor_id', profile.id)
  .eq('status', 'booked')
  .gte('scheduled_at', new Date().toISOString())
  .order('scheduled_at', { ascending: true })
  .limit(1)
  .single()

if (!appointment) return

const { data: patient } = await supabase
  .from('profiles')
  .select('full_name, phone, avatar_url, email')
  .eq('id', appointment.patient_id)
  .single()

setNextAppointment({ ...appointment, patient })

   console.log("🚀 ~ fetchNext ~ data appointment:", appointment)
  }
  fetchNext()
}, [profile?.id])

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
{nextAppointment ? (
  <View style={styles.appointmentCard}>
    <View style={styles.appointmentRow}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>
          {nextAppointment.patient?.full_name?.[0]?.toUpperCase() ?? 'P'}
        </Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.patientName}>
          {nextAppointment.patient?.full_name ?? 'Patient'}
        </Text>
        <Text style={styles.appointmentCondition}>
          {nextAppointment.notes ?? 'General Consultation'}
        </Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{nextAppointment.status}</Text>
      </View>
    </View>
    <View style={styles.appointmentMeta}>
      <MaterialIcons name="schedule" size={14} color="#6B7280" />
      <Text style={styles.metaText}>
        {new Date(nextAppointment.scheduled_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </Text>
      <Text style={styles.metaDot}>·</Text>
      <MaterialIcons name="access-time" size={14} color="#6B7280" />
      <Text style={styles.metaText}>
        {new Date(nextAppointment.scheduled_at).toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit',
        })}
      </Text>
    </View>
  </View>
) : (
  <View style={styles.emptyCard}>
    <MaterialIcons name="event-busy" size={40} color="#D1D5DB" />
    <Text style={styles.emptyTitle}>No upcoming appointments</Text>
    <Text style={styles.emptySub}>New bookings will appear here</Text>
  </View>
)}
</View>

        {/* Recent orders */}
    <View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Recent Medicine Orders</Text>
    <Pressable onPress={() => router.navigate('/orders' as any)}>
      <Text style={styles.seeAll}>See all</Text>
    </Pressable>
  </View>

  {recentOrder ? (
    <View style={styles.orderCard}>
      <View style={styles.orderTopRow}>
        <View style={styles.orderIconCircle}>
          <MaterialIcons name="shopping-bag" size={22} color="#6050D0" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.patientName}>
            {recentOrder.patient?.full_name ?? 'Patient'}
          </Text>
          <Text style={styles.orderItemsText} numberOfLines={1}>
            {recentOrder.order_items?.map((i: any) => i.name).join(', ') ?? 'Medicine'}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          recentOrder.status === 'placed' && { backgroundColor: '#FFF7ED' },
          recentOrder.status === 'delivered' && { backgroundColor: '#ECFDF5' },
        ]}>
          <Text style={[
            styles.statusText,
            recentOrder.status === 'placed' && { color: '#EA580C' },
            recentOrder.status === 'delivered' && { color: '#059669' },
          ]}>
            {recentOrder.status}
          </Text>
        </View>
      </View>

      <View style={styles.orderBottomRow}>
        <View style={styles.orderMetaItem}>
          <MaterialIcons name="receipt" size={14} color="#6B7280" />
          <Text style={styles.metaText}>#{recentOrder.id}</Text>
        </View>
        <Text style={styles.metaDot}>·</Text>
        <View style={styles.orderMetaItem}>
          <MaterialIcons name="schedule" size={14} color="#6B7280" />
          <Text style={styles.metaText}>
            {new Date(recentOrder.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short',
            })}
          </Text>
        </View>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.orderTotal}>₹{recentOrder.total}</Text>
      </View>
    </View>
  ) : (
    <View style={styles.emptyCard}>
      <MaterialIcons name="shopping-bag" size={40} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No recent orders</Text>
      <Text style={styles.emptySub}>Patient medicine orders will appear here</Text>
    </View>
  )}
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
  appointmentCard: {
  backgroundColor: '#fff',
  borderRadius: 14,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 1,
},
appointmentRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
avatarCircle: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#6050D0',
  alignItems: 'center',
  justifyContent: 'center',
},
avatarText: {
  color: '#fff',
  fontSize: 18,
  fontWeight: '700',
},
patientName: {
  fontSize: 15,
  fontWeight: '700',
  color: '#1A1A2E',
},
appointmentCondition: {
  fontSize: 13,
  color: '#6B7280',
  marginTop: 2,
},
statusBadge: {
  backgroundColor: '#EEF2FF',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 8,
},
statusText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#6050D0',
  textTransform: 'capitalize',
},
appointmentMeta: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 12,
  paddingTop: 12,
  borderTopWidth: StyleSheet.hairlineWidth,
  borderTopColor: '#F0F0F0',
},
metaText: {
  fontSize: 13,
  color: '#6B7280',
  marginLeft: 4,
},
metaDot: {
  color: '#D1D5DB',
  marginHorizontal: 6,
},
orderCard: {
  backgroundColor: '#fff',
  borderRadius: 14,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 1,
},
orderTopRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
orderIconCircle: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#EEF2FF',
  alignItems: 'center',
  justifyContent: 'center',
},
orderItemsText: {
  fontSize: 13,
  color: '#6B7280',
  marginTop: 2,
},
orderBottomRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 12,
  paddingTop: 12,
  borderTopWidth: StyleSheet.hairlineWidth,
  borderTopColor: '#F0F0F0',
},
orderMetaItem: {
  flexDirection: 'row',
  alignItems: 'center',
},
orderTotal: {
  fontSize: 14,
  fontWeight: '700',
  color: '#1A1A2E',
},
})