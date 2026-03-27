import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase.web'

const BLUE = '#6050D0'

type Patient = {
  id: string
  full_name: string
  email: string
  phone?: string
  last_visit?: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function PatientsScreen() {
  const insets = useSafeAreaInsets()
  const { profile } = useAuthContext()
  const doctorId = profile?.id

  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchPatients = useCallback(async () => {
    if (!doctorId) return

    const { data } = await supabase
      .from('appointments')
      .select('patient:profiles!patient_id(id, full_name, email, phone), created_at')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })

    if (!data) {
      setLoading(false)
      return
    }

    const seen = new Map<string, Patient>()
    for (const row of data) {
      const p = row.patient as unknown as { id: string; full_name: string; email: string; phone?: string }
      if (p && !seen.has(p.id)) {
        seen.set(p.id, {
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          phone: p.phone,
          last_visit: row.created_at,
        })
      }
    }

    setPatients(Array.from(seen.values()))
    setLoading(false)
  }, [doctorId])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  const renderPatient = ({ item }: { item: Patient }) => (
    <View style={styles.card}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.patientName}>{item.full_name}</Text>
        <Text style={styles.patientEmail}>{item.email}</Text>
        {item.last_visit && (
          <View style={styles.visitRow}>
            <MaterialIcons name="schedule" size={13} color="#9CA3AF" />
            <Text style={styles.visitText}>Last visit: {formatDate(item.last_visit)}</Text>
          </View>
        )}
      </View>
      {item.phone && (
        <Pressable style={styles.phoneBtn}>
          <MaterialIcons name="phone" size={18} color={BLUE} />
        </Pressable>
      )}
    </View>
  )

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Patients</Text>
        <Text style={styles.headerCount}>
          {loading ? '...' : `${patients.length} total`}
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <MaterialIcons name="close" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={BLUE} style={{ marginTop: 60 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="people-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {search ? 'No patients match your search' : 'No patients yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {search ? 'Try a different name or email' : 'Patients will appear here after their first appointment'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderPatient}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: BLUE,
  },
  cardInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  patientEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  visitText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  phoneBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 80,
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
})