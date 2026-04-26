import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useDoctorContext } from '@/hooks/use-doctor-context'
import { supabase } from '@/lib/supabase.web'

const BLUE = '#6050D0'

type Article = {
  id: number
  title: string
  content: string
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function readTime(content: string) {
  const words = content.split(/\s+/).length
  const mins = Math.max(1, Math.ceil(words / 200))
  return `${mins} min read`
}

export default function ArticlesScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { selectedDoctor } = useDoctorContext()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedDoctor) {
      setArticles([])
      setLoading(false)
      return
    }
    const fetch = async () => {
      const { data } = await supabase
        .from('doctor_articles')
        .select('id, title, content, created_at')
        .eq('doctor_id', selectedDoctor.id)
        .eq('published', true)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })

      setArticles(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [selectedDoctor?.id])

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Health Articles</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={BLUE} style={{ marginTop: 60 }} />
        ) : articles.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="article" size={56} color="#D1D5DB" />
            <Text style={styles.emptyText}>No articles yet</Text>
          </View>
        ) : (
          articles.map((article) => (
            <Pressable
              key={article.id}
              style={styles.card}
              onPress={() => router.push(`/article-detail?id=${article.id}`)}
            >
              <View style={styles.cardTop}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Article</Text>
                </View>
                <Text style={styles.cardDate}>{formatDate(article.created_at)}</Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>{article.title}</Text>
              <Text style={styles.cardSummary} numberOfLines={3}>{article.content}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.readTimeWrap}>
                  <MaterialIcons name="schedule" size={14} color="#9CA3AF" />
                  <Text style={styles.readTimeText}>{readTime(article.content)}</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={18} color={BLUE} />
              </View>
            </Pressable>
          ))
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
    borderRadius: 16,
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
  badge: {
    backgroundColor: BLUE + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '600',
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
    lineHeight: 22,
  },
  cardSummary: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
})
