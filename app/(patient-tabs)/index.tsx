import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { useDoctorContext } from '@/hooks/use-doctor-context'
import { useThemeColor } from '@/hooks/use-theme-color'
import { supabase } from '@/lib/supabase.web'

const TINT = '#1565C0'

const SERVICES = [
  { key: 'appointment', icon: 'event', label: 'Book\nAppointment', color: '#E8F5E9', iconColor: '#43A047' },
  { key: 'medicines', icon: 'medication', label: 'Order\nMedicines', color: '#FFF3E0', iconColor: '#FB8C00' },
  { key: 'articles', icon: 'menu-book', label: 'Health\nArticles', color: '#E3F2FD', iconColor: '#1E88E5' },
  { key: 'consult', icon: 'phone', label: 'Consult\nDoctor', color: '#FCE4EC', iconColor: '#E53935' },
] as const

type ArticleRow = {
  id: number
  title: string
  content: string
  created_at: string
}

export default function PatientHomeScreen() {
  const { profile } = useAuthContext()
  const { selectedDoctor } = useDoctorContext()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const textColor = useThemeColor({}, 'text')
  const bgColor = useThemeColor({}, 'background')
  const subtextColor = useThemeColor({}, 'icon')

  const [articles, setArticles] = useState<ArticleRow[]>([])

  useEffect(() => {
    if (!selectedDoctor) {
      setArticles([])
      return
    }
    supabase
      .from('doctor_articles')
      .select('id, title, content, created_at')
      .eq('doctor_id', selectedDoctor.id)
      .eq('published', true)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setArticles(data ?? []))
  }, [selectedDoctor?.id])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const readTime = (content: string) => {
    const mins = Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
    return `${mins} min read`
  }

  const handleServicePress = (key: string) => {
    if (!selectedDoctor && (key === 'appointment' || key === 'articles')) {
      router.push('/doctors')
      return
    }
    if (key === 'appointment') router.push('/schedule')
    else if (key === 'articles') router.push('/articles')
  }

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: subtextColor }]}>Hello,</Text>
            <Text style={[styles.name, { color: textColor }]}>{firstName} 👋</Text>
          </View>
          <Pressable style={[styles.notifBtn, { backgroundColor: bgColor }]}>
            <MaterialIcons name="notifications-none" size={24} color={textColor} />
          </Pressable>
        </View>

        {/* Search */}
        <Pressable style={styles.searchBar}>
          <MaterialIcons name="search" size={22} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Search articles, medicines...</Text>
        </Pressable>

        {/* Doctor Card */}
        {selectedDoctor ? (
          <View style={styles.doctorCard}>
            <View style={styles.doctorCardContent}>
              <View style={styles.doctorAvatar}>
                <MaterialIcons name="person" size={28} color="#fff" />
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{selectedDoctor.full_name}</Text>
                {selectedDoctor.specialty ? (
                  <Text style={styles.doctorSpec}>{selectedDoctor.specialty}</Text>
                ) : null}
                {selectedDoctor.rating != null && (
                  <View style={styles.ratingRow}>
                    <MaterialIcons name="star" size={14} color="#FFC107" />
                    <Text style={styles.ratingText}>{selectedDoctor.rating}</Text>
                  </View>
                )}
              </View>
              <Pressable onPress={() => router.push('/doctors')} style={styles.changeBtn}>
                <Text style={styles.changeText}>Change</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.doctorBookBtn}
              onPress={() => router.push('/schedule')}
            >
              <MaterialIcons name="event" size={18} color={TINT} />
              <Text style={styles.doctorBookText}>Book Appointment</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.selectDoctorCard} onPress={() => router.push('/doctors')}>
            <View style={styles.selectDoctorIcon}>
              <MaterialIcons name="person-search" size={32} color={TINT} />
            </View>
            <View style={styles.selectDoctorInfo}>
              <Text style={styles.selectDoctorTitle}>Find a Doctor</Text>
              <Text style={styles.selectDoctorSub}>Select a doctor to get started</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#9CA3AF" />
          </Pressable>
        )}

        {/* Services */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Services</Text>
        </View>
        <View style={styles.servicesGrid}>
          {SERVICES.map((s) => (
            <Pressable key={s.key} style={styles.serviceItem} onPress={() => handleServicePress(s.key)}>
              <View style={[styles.serviceIcon, { backgroundColor: s.color }]}>
                <MaterialIcons name={s.icon as any} size={26} color={s.iconColor} />
              </View>
              <Text style={[styles.serviceLabel, { color: textColor }]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Doctor Posts */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Doctor's Posts</Text>
          <Pressable onPress={() => router.push('/articles')}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {articles.map((post) => (
          <Pressable
            key={post.id}
            style={[styles.postCard, { backgroundColor: bgColor }]}
            onPress={() => router.push(`/article-detail?id=${post.id}`)}
          >
            <View style={styles.postCategoryRow}>
              <View style={styles.postCategoryBadge}>
                <Text style={styles.postCategoryText}>Article</Text>
              </View>
              <Text style={[styles.postDate, { color: subtextColor }]}>{formatDate(post.created_at)}</Text>
            </View>
            <Text style={[styles.postTitle, { color: textColor }]}>{post.title}</Text>
            <Text style={[styles.postSummary, { color: subtextColor }]} numberOfLines={2}>
              {post.content}
            </Text>
            <View style={styles.postFooter}>
              <View style={styles.postReadTime}>
                <MaterialIcons name="schedule" size={14} color={subtextColor} />
                <Text style={[styles.postReadTimeText, { color: subtextColor }]}>{readTime(post.content)}</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={18} color={TINT} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {},
  greeting: {
    fontSize: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },

  // Doctor Card
  doctorCard: {
    backgroundColor: TINT,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  doctorCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  doctorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  doctorSpec: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
  },
  changeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  doctorBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  doctorBookText: {
    color: TINT,
    fontSize: 15,
    fontWeight: '700',
  },
  selectDoctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TINT + '10',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: TINT + '30',
    borderStyle: 'dashed',
    padding: 18,
    marginBottom: 24,
  },
  selectDoctorIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: TINT + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  selectDoctorInfo: {
    flex: 1,
  },
  selectDoctorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  selectDoctorSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  // Services
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: TINT,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  serviceItem: {
    alignItems: 'center',
    width: '23%',
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Posts
  postCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  postCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postCategoryBadge: {
    backgroundColor: TINT + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  postCategoryText: {
    color: TINT,
    fontSize: 12,
    fontWeight: '600',
  },
  postDate: {
    fontSize: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 22,
  },
  postSummary: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postReadTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postReadTimeText: {
    fontSize: 12,
  },
})
