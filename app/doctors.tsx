import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Doctor, useDoctorContext } from '@/hooks/use-doctor-context'
import { supabase } from '@/lib/supabase.web'

const BLUE = '#6050D0'

export default function DoctorsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { selectedDoctor, setSelectedDoctor } = useDoctorContext()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      console.log('[Doctors] Fetching profiles with role=doctor...')
      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'doctor')

      if (!profileRows || profileRows.length === 0) {
        setDoctors([])
        setLoading(false)
        return
      }

      const ids = profileRows.map((p) => p.id)
      const { data: doctorRows } = await supabase
        .from('doctors')
        .select('id, specialty, bio, rating')
        .in('id', ids)

      const doctorMap = new Map(
        (doctorRows ?? []).map((d: any) => [d.id, d])
      )

      const mapped: Doctor[] = profileRows.map((p: any) => {
        const extra = doctorMap.get(p.id)
        return {
          id: p.id,
          full_name: p.full_name ?? 'Doctor',
          specialty: extra?.specialty || null,
          bio: extra?.bio || null,
          rating: extra?.rating ?? null,
        }
      })

      setDoctors(mapped)
      setLoading(false)
    }
    fetch()
  }, [])

  const handleSelect = (doc: Doctor) => {
    setSelectedDoctor(doc)
    router.back()
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Select a Doctor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={BLUE} style={{ marginTop: 60 }} />
        ) : doctors.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="person-search" size={56} color="#D1D5DB" />
            <Text style={styles.emptyText}>No doctors available</Text>
          </View>
        ) : (
          doctors.map((doc) => {
            const isSelected = selectedDoctor?.id === doc.id
            return (
              <Pressable
                key={doc.id}
                style={[isSelected && styles.cardSelected]}
                onPress={() => handleSelect(doc)}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                    <MaterialIcons name="person" size={28} color={isSelected ? '#fff' : BLUE} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.docName}>{doc.full_name}</Text>
                    {doc.specialty ? (
                      <Text style={styles.docSpec}>{doc.specialty}</Text>
                    ) : null}
                    {doc.rating != null && (
                      <View style={styles.ratingRow}>
                        <MaterialIcons name="star" size={14} color="#FFC107" />
                        <Text style={styles.ratingText}>{doc.rating}</Text>
                      </View>
                    )}
                  </View>
                  {isSelected && (
                    <View style={styles.checkWrap}>
                      <MaterialIcons name="check-circle" size={24} color={BLUE} />
                    </View>
                  )}
                </View>
                {doc.bio ? (
                  <Text style={styles.bioText} numberOfLines={2}>{doc.bio}</Text>
                ) : null}
              </Pressable>
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
    // backgroundColor: '#fff',
    // borderRadius: 16,
    // padding: 16,
    // marginBottom: 12,
    // borderWidth: 2,
    // borderColor: 'transparent',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.04,
    // shadowRadius: 6,
    // elevation: 1,
  },
  cardSelected: {
    borderColor: BLUE,
    backgroundColor: BLUE + '08',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BLUE + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarSelected: {
    backgroundColor: BLUE,
  },
  info: {
    flex: 1,
  },
  docName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  docSpec: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#9CA3AF',
    marginTop: 10,
  },
  checkWrap: {
    marginLeft: 8,
  },
})
