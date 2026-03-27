import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useDoctorContext } from '@/hooks/use-doctor-context'
import { supabase } from '@/lib/supabase.web'

const TINT = '#6050D0'

export default function ConsultScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { selectedDoctor } = useDoctorContext()

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    if (!selectedDoctor) return
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('email,phone,full_name')
        .eq('id', selectedDoctor.id)
        .single()
      if (data) {
        setEmail(data.email)
        setPhone(data.phone)
        setName(data.full_name)
      }
    }
    fetch()
  }, [selectedDoctor?.id])

  return (
    <View style={styles.root}>
      {/* Colored header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Consult Doctor</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar + name */}
        <View style={styles.profileWrap}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={40} color={TINT} />
          </View>
          <Text style={styles.doctorName}>{name || 'Doctor'}</Text>
          <Text style={styles.doctorTitle}>Ayurvedic Practitioner</Text>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`tel:${phone}`)}
            >
              <MaterialIcons name="phone" size={20} color="#fff" />
              <Text style={styles.actionText}>Call</Text>
            </Pressable>
            <Pressable
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`mailto:${email}`)}
            >
              <MaterialIcons name="email" size={20} color="#fff" />
              <Text style={styles.actionText}>Email</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* White card */}
      <View style={styles.card}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { label: 'Patients', value: '200+' },
              { label: 'Experience', value: '5 Yrs' },
              { label: 'Rating', value: '4.9 ⭐' },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.sectionText}>
              {name || 'The doctor'} is an experienced Ayurvedic practitioner specializing in holistic wellness,
              chronic disease management, and lifestyle disorders. Constantly working to provide
              personalized care for every patient.
            </Text>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.sectionCard}>
              <Pressable
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${phone}`)}
              >
                <View style={styles.contactIcon}>
                  <MaterialIcons name="phone" size={20} color={TINT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>{phone || '—'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#C4C4C4" />
              </Pressable>

              <View style={styles.rowDivider} />

              <Pressable
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${email}`)}
              >
                <View style={styles.contactIcon}>
                  <MaterialIcons name="email" size={20} color={TINT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>{email || '—'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#C4C4C4" />
              </Pressable>
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            {/* <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <Pressable>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View> */}
            {/* To do: add reviews */}
            {/* <View style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <View style={styles.reviewAvatar}>
                  <MaterialIcons name="person" size={18} color={TINT} />
                </View>
                <View>
                  <Text style={styles.reviewName}>Patient</Text>
                  <Text style={styles.reviewStars}>⭐⭐⭐⭐⭐</Text>
                </View>
              </View>
              <Text style={styles.reviewText}>
                Many thanks to {name || 'the doctor'}! Very professional and caring.
                Highly recommend for Ayurvedic consultations.
              </Text>
            </View> */}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.contactIcon}>
                <MaterialIcons name="location-on" size={20} color={TINT} />
              </View>
              <View>
                <Text style={styles.locationTitle}>Ayur Wellness Center</Text>
                <Text style={styles.locationSub}>Hyderabad, Telangana, India</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TINT,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileWrap: {
    alignItems: 'center',
    gap: 6,
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
    marginBottom: 4,
  },
  doctorName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  doctorTitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#F0F0F0',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  seeAll: {
    color: TINT,
    fontWeight: '600',
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 2,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  reviewStars: {
    fontSize: 11,
    marginTop: 2,
  },
  reviewText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  locationSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
})