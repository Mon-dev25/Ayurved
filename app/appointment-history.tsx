import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase.web'

const BLUE = '#6050D0'

type Appointment = {
  id: number
  scheduled_at: string
  status: string
  doctor_id: string
  doctor_slots: { start_ts: string; end_ts: string } | null
  doctor_name?: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  let h = d.getHours()
  const m = d.getMinutes()
  const period = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  booked: { bg: '#E0E0F0', text: '#6050D0' },
  confirmed: { bg: '#D1FAE5', text: '#059669' },
  completed: { bg: '#E0E7FF', text: '#4338CA' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
}

export default function AppointmentHistoryScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { profile } = useAuthContext()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!profile?.id) return

      const { data: rows } = await supabase
        .from('appointments')
        .select('id, scheduled_at, status, doctor_id, doctor_slots(start_ts, end_ts)')
        .eq('patient_id', profile.id)
        .order('scheduled_at', { ascending: false })

      if (!rows || rows.length === 0) {
        setAppointments([])
        setLoading(false)
        return
      }

      const doctorIds = [...new Set(rows.map((r: any) => r.doctor_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', doctorIds)

      const nameMap: Record<string, string> = {}
      ;(profiles ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name ?? 'Doctor' })

      const enriched = rows.map((r: any) => ({
        ...r,
        doctor_name: nameMap[r.doctor_id] ?? 'Doctor',
      }))

      setAppointments(enriched)
      setLoading(false)
    }
    fetchAppointments()
  }, [profile?.id])

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Appointment History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={BLUE} style={{ marginTop: 60 }} />
        ) : appointments.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="event-busy" size={56} color="#D1D5DB" />
            <Text style={styles.emptyText}>No appointments yet</Text>
          </View>
        ) : (
          appointments.map((appt) => {
            const colors = STATUS_STYLES[appt.status] ?? STATUS_STYLES.pending
            return (
              <View key={appt.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardDateWrap}>
                    <MaterialIcons name="event" size={18} color={BLUE} />
                    <Text style={styles.cardDate}>{formatDate(appt.scheduled_at)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.statusText, { color: colors.text }]}>{appt.status}</Text>
                  </View>
                </View>
                <View style={styles.cardTimeRow}>
                  <MaterialIcons name="schedule" size={16} color="#9CA3AF" />
                  <Text style={styles.cardTime}>
                    {appt.doctor_slots
                      ? `${formatTime(appt.doctor_slots.start_ts)} – ${formatTime(appt.doctor_slots.end_ts)}`
                      : formatTime(appt.scheduled_at)}
                  </Text>
                </View>
                <View style={styles.cardDoctor}>
                  <MaterialIcons name="person" size={16} color="#9CA3AF" />
                  <Text style={styles.cardDoctorText}>{appt.doctor_name}</Text>
                </View>
              </View>
            )
          })
        )}
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
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardDoctor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardDoctorText: {
    fontSize: 14,
    color: '#6B7280',
  },
})
