import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase.web'

const TINT = '#6050D0'

type OrderItem = {
  id: number
  name: string
  qty: number
  price: number
}

type Order = {
  id: number
  total: number
  status: string
  created_at: string
  order_items: OrderItem[]
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  placed: { bg: '#FEF3C7', text: '#D97706' },
  confirmed: { bg: '#D1FAE5', text: '#059669' },
  shipped: { bg: '#DBEAFE', text: '#2563EB' },
  delivered: { bg: '#E0E7FF', text: '#4338CA' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { profile } = useAuthContext()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    const fetch = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, total, status, created_at, order_items(id, name, qty, price)')
        .eq('patient_id', profile.id)
        .order('created_at', { ascending: false })
      setOrders((data as any) ?? [])
      setLoading(false)
    }
    fetch()
  }, [profile?.id])

  return (
    <View style={styles.root}>
      {/* Colored header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>My Orders</Text>
          {/* <Pressable
            style={styles.newOrderBtn}
            onPress={() => router.navigate('/place-order')}
          >
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={styles.newOrderText}>New</Text>
          </Pressable> */}
        </View>
      </View>

      {/* White card */}
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={TINT} style={{ marginTop: 60 }} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="shopping-bag" size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>Place your first order for medicines</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.navigate('/place-order')}>
              <Text style={styles.emptyBtnText}>Order Medicines</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            {orders.map((order) => {
              const colors = STATUS_COLORS[order.status] ?? STATUS_COLORS.placed
              return (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.cardTop}>
                    <View>
                      <Text style={styles.orderId}>Order #{order.id}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.statusText, { color: colors.text }]}>{order.status}</Text>
                    </View>
                  </View>

                  {order.order_items?.length > 0 && (
                    <View style={styles.itemsWrap}>
                      {order.order_items.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.itemQty}>x{item.qty}</Text>
                          <Text style={styles.itemPrice}>₹{item.price}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.cardBottom}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>₹{order.total}</Text>
                  </View>
                </View>
              )
            })}
          </ScrollView>
        )}
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
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  newOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newOrderText: {
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
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyBtn: {
    backgroundColor: TINT,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  orderCard: {
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
  itemsWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    marginBottom: 10,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  itemQty: {
    fontSize: 13,
    color: '#9CA3AF',
    marginHorizontal: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
  },
})