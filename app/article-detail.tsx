import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function readTime(content: string) {
  const words = content.split(/\s+/).length
  const mins = Math.max(1, Math.ceil(words / 200))
  return `${mins} min read`
}

export default function ArticleDetailScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { selectedDoctor } = useDoctorContext()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const closing = useRef(false)

  const handleClose = useCallback(() => {
    if (closing.current) return
    closing.current = true
    if (router.canGoBack()) {
      router.back()
    }
  }, [router])

  useEffect(() => {
    if (!id) return
    const fetch = async () => {
      const { data } = await supabase
        .from('doctor_articles')
        .select('id, title, content, created_at')
        .eq('id', Number(id))
        .single()

      setArticle(data)
      setLoading(false)
    }
    fetch()
  }, [id])

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleClose} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Article</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={BLUE} style={{ marginTop: 60 }} />
      ) : !article ? (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="error-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Article not found</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.meta}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{selectedDoctor?.full_name ?? 'Doctor'}</Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons name="event" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>{formatDate(article.created_at)}</Text>
            </View>
            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>{readTime(article.content)}</Text>
            </View>
          </View>

          <Text style={styles.title}>{article.title}</Text>

          <View style={styles.divider} />

          <Text style={styles.body}>{article.content}</Text>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
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
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  meta: {
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: BLUE + '18',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 4,
  },
  badgeText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    lineHeight: 32,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 20,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: '#374151',
  },
})
