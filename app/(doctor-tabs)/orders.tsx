import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase.web'

const BLUE = '#6050D0'

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
  delivery_address: any
  patient_id: string
  patient_name?: string
  order_items: OrderItem[]
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  placed: { bg: '#FEF3C7', text: '#D97706' },
  confirmed: { bg: '#D1FAE5', text: '#059669' },
  shipped: { bg: '#DBEAFE', text: '#2563EB' },
  delivered: { bg: '#E0E7FF', text: '#4338CA' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
}

const NEXT_STATUS: Record<string, string> = {
  placed: 'confirmed',
  confirmed: 'shipped',
  shipped: 'delivered',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DoctorOrdersScreen() {
  const insets = useSafeAreaInsets()
  const { profile } = useAuthContext()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  const fetchOrders = async () => {
    if (!profile?.id) return

    const { data: rows } = await supabase
      .from('orders')
      .select('id, total, status, created_at, delivery_address, patient_id, order_items(id, name, qty, price)')
      .eq('doctor_id', profile.id)
      .order('created_at', { ascending: false })

    if (!rows || rows.length === 0) {
      setOrders([])
      setLoading(false)
      return
    }

    const patientIds = [...new Set(rows.map((r: any) => r.patient_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', patientIds)

    const nameMap: Record<string, string> = {}
    ;(profiles ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name ?? 'Patient' })

    const enriched = rows.map((r: any) => ({
      ...r,
      patient_name: nameMap[r.patient_id] ?? 'Patient',
    }))

    setOrders(enriched)
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [profile?.id])

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    setUpdating(orderId)
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
    setUpdating(null)
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Patient Orders</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{orders.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={BLUE} style={{ marginTop: 60 }} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="receipt-long" size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>Orders from your patients will appear here</Text>
          </View>
        ) : (
          orders.map((order) => {
            const colors = STATUS_COLORS[order.status] ?? STATUS_COLORS.placed
            const nextStatus = NEXT_STATUS[order.status]
            return (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderId}>Order #{order.id}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.statusText, { color: colors.text }]}>{order.status}</Text>
                  </View>
                </View>

                <View style={styles.patientRow}>
                  <MaterialIcons name="person" size={16} color="#9CA3AF" />
                  <Text style={styles.patientName}>{order.patient_name}</Text>
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

                {order.delivery_address && (
                  <View style={styles.addressRow}>
                    <MaterialIcons name="location-on" size={14} color="#9CA3AF" />
                    <Text style={styles.addressText} numberOfLines={2}>
                      {typeof order.delivery_address === 'string'
                        ? order.delivery_address
                        : order.delivery_address.address ?? JSON.stringify(order.delivery_address)}
                    </Text>
                  </View>
                )}

                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>₹{order.total}</Text>
                  </View>
                  {nextStatus && (
                    <Pressable
                      style={[styles.actionBtn, updating === order.id && { opacity: 0.6 }]}
                      onPress={() => handleUpdateStatus(order.id, nextStatus)}
                      disabled={updating === order.id}
                    >
                      {updating === order.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.actionBtnText}>
                          Mark {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                        </Text>
                      )}
                    </Pressable>
                  )}
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
  countBadge: {
    backgroundColor: BLUE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
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
    textAlign: 'center',
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
    alignItems: 'flex-start',
    marginBottom: 8,
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

  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  patientName: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  addressText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
    lineHeight: 16,
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  actionBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
})
