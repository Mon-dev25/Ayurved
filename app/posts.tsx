import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase.web'

const BLUE = '#6050D0'

type Article = {
  id: number
  title: string
  content: string
  published: boolean
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PostsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { profile } = useAuthContext()
  const doctorId = profile?.id

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchArticles = useCallback(async () => {
    if (!doctorId) return
    const { data } = await supabase
      .from('doctor_articles')
      .select('id, title, content, published, created_at')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })

    setArticles(data ?? [])
    setLoading(false)
  }, [doctorId])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your article.')
      return
    }
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please write some content for your article.')
      return
    }
    if (!doctorId) return

    setSaving(true)
    const { error } = await supabase.from('doctor_articles').insert({
      doctor_id: doctorId,
      title: title.trim(),
      content: content.trim(),
      published: true,
      visibility: 'public',
    })
    setSaving(false)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    setTitle('')
    setContent('')
    setShowForm(false)
    fetchArticles()
  }

  const handleDelete = (id: number) => {
    Alert.alert('Delete Article', 'Are you sure you want to delete this article?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('doctor_articles').delete().eq('id', id)
          fetchArticles()
        },
      },
    ])
  }

  const handleTogglePublish = async (article: Article) => {
    await supabase
      .from('doctor_articles')
      .update({ published: !article.published })
      .eq('id', article.id)
    fetchArticles()
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          {router.canGoBack() && (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={24} color="#1A1A2E" />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>My Articles</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => setShowForm(!showForm)}
        >
          <MaterialIcons name={showForm ? 'close' : 'add'} size={22} color="#fff" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>New Article</Text>
              <TextInput
                style={styles.input}
                placeholder="Article title"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write your article content..."
                placeholderTextColor="#9CA3AF"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
              <Pressable
                style={[styles.publishBtn, saving && { opacity: 0.6 }]}
                onPress={handlePublish}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="publish" size={18} color="#fff" />
                    <Text style={styles.publishText}>Publish Article</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {loading ? (
            <ActivityIndicator color={BLUE} style={{ marginTop: 40 }} />
          ) : articles.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="article" size={56} color="#D1D5DB" />
              <Text style={styles.emptyText}>No articles yet</Text>
              <Text style={styles.emptySubtext}>Tap + to write your first article</Text>
            </View>
          ) : (
            articles.map((article) => (
              <View key={article.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.statusBadge, !article.published && styles.statusDraft]}>
                    <Text style={[styles.statusText, !article.published && styles.statusDraftText]}>
                      {article.published ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                  <Text style={styles.cardDate}>{formatDate(article.created_at)}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{article.title}</Text>
                <Text style={styles.cardContent} numberOfLines={3}>{article.content}</Text>
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => handleTogglePublish(article)}
                  >
                    <MaterialIcons
                      name={article.published ? 'visibility-off' : 'visibility'}
                      size={18}
                      color="#6B7280"
                    />
                    <Text style={styles.actionText}>
                      {article.published ? 'Unpublish' : 'Publish'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => handleDelete(article.id)}
                  >
                    <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                    <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  publishText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 80,
    gap: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
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
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDraft: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  statusDraftText: {
    color: '#D97706',
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
  cardContent: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
})