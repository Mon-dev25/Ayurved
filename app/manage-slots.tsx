import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAuthContext } from '@/hooks/use-auth-context'
import { useThemeColor } from '@/hooks/use-theme-color'
import { supabase } from '@/lib/supabase.web'

const TINT = '#6050D0'
const TINT_LIGHT = '#E0E0F0'
const DANGER = '#EF4444'
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const TIME_OPTIONS = [
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM',
  '10:00 PM',
]

const MAX_BOOKINGS_PER_SLOT = 3

type Slot = {
  id: number
  start_ts: string
  end_ts: string
  status: string
  booked_count: number
}

function parseTimeLabel(label: string): { hours: number; minutes: number } {
  const [time, period] = label.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return { hours: h, minutes: m }
}

function formatTime(iso: string) {
  // Shift UTC timestamp to IST (UTC+5:30) and read with UTC methods
  const d = new Date(iso)
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
  let h = ist.getUTCHours()
  const m = ist.getUTCMinutes()
  const period = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function ManageSlotsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { profile } = useAuthContext()
  const textColor = useThemeColor({}, 'text')
  const bgColor = useThemeColor({}, 'background')
  const subtextColor = useThemeColor({}, 'icon')

  // Use IST (UTC+5:30) for today so past-day and today-highlight are correct in India
  const today = (() => {
    const now = new Date()
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
    return new Date(utcMs + 5.5 * 60 * 60_000)
  })()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const doctorId = profile?.id ?? null
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)

  const [rangeStart, setRangeStart] = useState<string | null>(null)
  const [rangeEnd, setRangeEnd] = useState<string | null>(null)
  const [pickerField, setPickerField] = useState<'from' | 'to' | null>(null)

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth])
  const firstDay = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth), [viewYear, viewMonth])

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [firstDay, daysInMonth])

  const isPastDay = (day: number) => {
    if (viewYear < today.getFullYear()) return true
    if (viewYear === today.getFullYear() && viewMonth < today.getMonth()) return true
    if (viewYear === today.getFullYear() && viewMonth === today.getMonth() && day < today.getDate()) return true
    return false
  }

  const isToday = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()

  const startTimeOptions = useMemo(() => {
    const isSelectedToday =
      selectedDay !== null &&
      viewYear === today.getFullYear() &&
      viewMonth === today.getMonth() &&
      selectedDay === today.getDate()

    if (!isSelectedToday) return TIME_OPTIONS

    // Filter out times that are <= current IST time
    const currentMinutes = today.getHours() * 60 + today.getMinutes()
    return TIME_OPTIONS.filter((label) => {
      const { hours, minutes } = parseTimeLabel(label)
      return hours * 60 + minutes > currentMinutes
    })
  }, [selectedDay, viewYear, viewMonth, today])

  const endTimeOptions = useMemo(() => {
    if (!rangeStart) return []
    const startIdx = TIME_OPTIONS.indexOf(rangeStart)
    return TIME_OPTIONS.slice(startIdx + 1)
  }, [rangeStart])

  const generatedPreview = useMemo(() => {
    if (!rangeStart || !rangeEnd) return []
    const start = parseTimeLabel(rangeStart)
    const end = parseTimeLabel(rangeEnd)
    const startMinutes = start.hours * 60 + start.minutes
    const endMinutes = end.hours * 60 + end.minutes

    const previews: { startLabel: string; endLabel: string }[] = []
    for (let m = startMinutes; m + 30 <= endMinutes; m += 30) {
      const sH = Math.floor(m / 60)
      const sM = m % 60
      const eH = Math.floor((m + 30) / 60)
      const eM = (m + 30) % 60

      const fmt = (h: number, min: number) => {
        const period = h >= 12 ? 'PM' : 'AM'
        let dh = h > 12 ? h - 12 : h === 0 ? 12 : h
        return `${String(dh).padStart(2, '0')}:${String(min).padStart(2, '0')} ${period}`
      }
      previews.push({ startLabel: fmt(sH, sM), endLabel: fmt(eH, eM) })
    }
    return previews
  }, [rangeStart, rangeEnd])

  const fetchSlots = useCallback(async (day: number) => {
    if (!doctorId) return
    setLoadingSlots(true)
    setSlots([])

    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayStart = `${dateStr}T00:00:00+05:30`
    const dayEnd = `${dateStr}T23:59:59+05:30`

    const { data } = await supabase
      .from('doctor_slots')
      .select('*')
      .eq('doctor_id', doctorId)
      .gte('start_ts', dayStart)
      .lte('start_ts', dayEnd)
      .order('start_ts', { ascending: true })

    const slotRows = data ?? []
    if (slotRows.length === 0) {
      setLoadingSlots(false)
      setSlots([])
      return
    }

    const slotIds = slotRows.map((s: any) => s.id)
    const { data: appts } = await supabase
      .from('appointments')
      .select('slot_id')
      .in('slot_id', slotIds)

    const countMap: Record<number, number> = {}
    ;(appts ?? []).forEach((a: any) => {
      countMap[a.slot_id] = (countMap[a.slot_id] ?? 0) + 1
    })

    const enriched: Slot[] = slotRows.map((s: any) => ({
      ...s,
      booked_count: countMap[s.id] ?? 0,
    }))

    setLoadingSlots(false)
    setSlots(enriched)
  }, [doctorId, viewYear, viewMonth])

  const handleDayPress = (day: number) => {
    setSelectedDay(day)
    setRangeStart(null)
    setRangeEnd(null)
    fetchSlots(day)
  }

  const goToPrevMonth = () => {
    setViewMonth((m) => (m === 0 ? (setViewYear((y) => y - 1), 11) : m - 1))
    setSelectedDay(null)
    setSlots([])
    setRangeStart(null)
    setRangeEnd(null)
  }

  const goToNextMonth = () => {
    setViewMonth((m) => (m === 11 ? (setViewYear((y) => y + 1), 0) : m + 1))
    setSelectedDay(null)
    setSlots([])
    setRangeStart(null)
    setRangeEnd(null)
  }

  const handleSetAvailability = async () => {
    if (!selectedDay || !rangeStart || !rangeEnd || !doctorId) return
    if (generatedPreview.length === 0) return

    setSaving(true)

    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    const start = parseTimeLabel(rangeStart)
    const end = parseTimeLabel(rangeEnd)
    const startMinutes = start.hours * 60 + start.minutes
    const endMinutes = end.hours * 60 + end.minutes

    const rows: { doctor_id: string; start_ts: string; end_ts: string; status: string }[] = []
    for (let m = startMinutes; m + 30 <= endMinutes; m += 30) {
      const sH = Math.floor(m / 60)
      const sM = m % 60
      const eH = Math.floor((m + 30) / 60)
      const eM = (m + 30) % 60

      const startTs = `${dateStr}T${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}:00+05:30`
      const endTs = `${dateStr}T${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}:00+05:30`
      rows.push({ doctor_id: doctorId, start_ts: startTs, end_ts: endTs, status: 'available' })
    }

    const { error } = await supabase.from('doctor_slots').insert(rows)
    setSaving(false)

    if (error) {
      Alert.alert('Failed', error.message)
      return
    }

    Alert.alert('Done', `${rows.length} slots created for ${MONTH_NAMES[viewMonth].slice(0, 3)} ${selectedDay}.`)
    setRangeStart(null)
    setRangeEnd(null)
    fetchSlots(selectedDay)
  }

  const handleDeleteSlot = (slot: Slot) => {
    if (slot.booked_count > 0) {
      Alert.alert('Cannot Delete', `This slot has ${slot.booked_count} booking(s). Cancel the appointments first.`)
      return
    }
    Alert.alert('Delete Slot', `Remove ${formatTime(slot.start_ts)} – ${formatTime(slot.end_ts)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('doctor_slots').delete().eq('id', slot.id)
          if (selectedDay) fetchSlots(selectedDay)
        },
      },
    ])
  }

  const handleClearDay = () => {
    if (!selectedDay || !doctorId) return
    const unbookedSlots = slots.filter((s) => s.booked_count === 0)
    if (unbookedSlots.length === 0) {
      Alert.alert('Cannot Clear', 'All slots have bookings and cannot be deleted.')
      return
    }

    Alert.alert('Clear Unbooked Slots', `Remove ${unbookedSlots.length} slot(s) with no bookings?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          const ids = unbookedSlots.map((s) => s.id)
          await supabase
            .from('doctor_slots')
            .delete()
            .in('id', ids)
          fetchSlots(selectedDay)
        },
      },
    ])
  }

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textColor }]}>Manage Availability</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <View style={[styles.card, { backgroundColor: bgColor }]}>
          <View style={styles.calendarHeader}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Select Date</Text>
            <View style={styles.calendarNav}>
              <Pressable onPress={goToPrevMonth} style={styles.calendarNavBtn}>
                <MaterialIcons name="chevron-left" size={22} color={textColor} />
              </Pressable>
              <Text style={[styles.calendarMonthLabel, { color: textColor }]}>
                {MONTH_NAMES[viewMonth].slice(0, 3)} {viewYear}
              </Text>
              <Pressable onPress={goToNextMonth} style={styles.calendarNavBtn}>
                <MaterialIcons name="chevron-right" size={22} color={textColor} />
              </Pressable>
            </View>
          </View>

          <View style={styles.dayLabelsRow}>
            {DAY_LABELS.map((label, i) => (
              <View key={i} style={styles.dayLabelCell}>
                <Text style={[styles.dayLabelText, { color: subtextColor }]}>{label}</Text>
              </View>
            ))}
          </View>

          {Array.from({ length: calendarCells.length / 7 }, (_, weekIdx) => (
            <View key={weekIdx} style={styles.weekRow}>
              {calendarCells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, cellIdx) => {
                const past = day ? isPastDay(day) : false
                const todayFlag = day ? isToday(day) : false
                const selected = day === selectedDay && day !== null

                return (
                  <Pressable
                    key={cellIdx}
                    style={[
                      styles.dayCell,
                      selected && styles.dayCellSelected,
                      todayFlag && !selected && styles.dayCellToday,
                    ]}
                    onPress={() => { if (day && !past) handleDayPress(day) }}
                    disabled={!day || past}
                  >
                    {day !== null && (
                      <Text
                        style={[
                          styles.dayText,
                          { color: textColor },
                          past && styles.dayTextPast,
                          selected && styles.dayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    )}
                  </Pressable>
                )
              })}
            </View>
          ))}
        </View>

        {/* Existing Slots */}
        {selectedDay !== null && (
          <View style={[styles.card, { backgroundColor: bgColor }]}>
            <View style={styles.slotsHeader}>
              <Text style={[styles.cardTitle, { color: textColor, marginBottom: 0 }]}>
                Slots for {MONTH_NAMES[viewMonth].slice(0, 3)} {selectedDay}
              </Text>
              {slots.filter((s) => s.booked_count === 0).length > 0 && (
                <Pressable onPress={handleClearDay} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>Clear All</Text>
                </Pressable>
              )}
            </View>

            {loadingSlots ? (
              <ActivityIndicator color={TINT} style={{ paddingVertical: 16 }} />
            ) : slots.length === 0 ? (
              <Text style={[styles.emptyText, { color: subtextColor }]}>No slots added yet.</Text>
            ) : (
              <View style={styles.slotsGrid}>
                {slots.map((slot) => {
                  const isFull = slot.booked_count >= MAX_BOOKINGS_PER_SLOT
                  const hasBookings = slot.booked_count > 0
                  return (
                    <View
                      key={slot.id}
                      style={[styles.slotChip, isFull && styles.slotChipFull, hasBookings && !isFull && styles.slotChipPartial]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.slotChipTime, isFull && styles.slotChipTimeFull]}>
                          {formatTime(slot.start_ts)} – {formatTime(slot.end_ts)}
                        </Text>
                        <Text style={[styles.slotChipCount, isFull && styles.slotChipCountFull]}>
                          {slot.booked_count}/{MAX_BOOKINGS_PER_SLOT} booked
                        </Text>
                      </View>
                      {isFull ? (
                        <View style={styles.fullBadge}>
                          <Text style={styles.fullBadgeText}>Full</Text>
                        </View>
                      ) : slot.booked_count === 0 ? (
                        <Pressable onPress={() => handleDeleteSlot(slot)} hitSlop={8} style={styles.slotDeleteBtn}>
                          <MaterialIcons name="close" size={14} color={DANGER} />
                        </Pressable>
                      ) : null}
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        )}

        {/* Set Availability Range */}
        {selectedDay !== null && (
          <View style={[styles.card, { backgroundColor: bgColor }]}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Set Availability Range</Text>
            <Text style={[styles.rangeHint, { color: subtextColor }]}>
              Pick start and end times. 30-minute slots are generated automatically.
            </Text>

            <View style={styles.dropdownRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dropdownLabel, { color: subtextColor }]}>From</Text>
                <Pressable
                  style={[styles.dropdown, rangeStart && styles.dropdownFilled]}
                  onPress={() => setPickerField('from')}
                >
                  <Text style={[styles.dropdownText, !rangeStart && { color: '#9CA3AF' }]}>
                    {rangeStart ?? 'Select'}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={20} color="#6B7280" />
                </Pressable>
              </View>

              <View style={styles.dropdownDivider}>
                <MaterialIcons name="arrow-forward" size={18} color={subtextColor} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.dropdownLabel, { color: subtextColor }]}>To</Text>
                <Pressable
                  style={[styles.dropdown, rangeEnd && styles.dropdownFilled, !rangeStart && styles.dropdownDisabled]}
                  onPress={() => { if (rangeStart) setPickerField('to') }}
                  disabled={!rangeStart}
                >
                  <Text style={[styles.dropdownText, !rangeEnd && { color: '#9CA3AF' }]}>
                    {rangeEnd ?? 'Select'}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={20} color="#6B7280" />
                </Pressable>
              </View>
            </View>

            {/* Preview */}
            {generatedPreview.length > 0 && (
              <View style={styles.previewSection}>
                <Text style={[styles.previewTitle, { color: textColor }]}>
                  {generatedPreview.length} slots will be created:
                </Text>
                <View style={styles.previewGrid}>
                  {generatedPreview.map((p, i) => (
                    <View key={i} style={styles.previewChip}>
                      <Text style={styles.previewChipText}>{p.startLabel}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <Pressable
              style={[styles.addBtn, (!(rangeStart && rangeEnd) || saving || generatedPreview.length === 0) && styles.addBtnDisabled]}
              onPress={handleSetAvailability}
              disabled={!(rangeStart && rangeEnd) || saving || generatedPreview.length === 0}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addBtnText}>
                  Set Availability ({generatedPreview.length} slots)
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal visible={pickerField !== null} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setPickerField(null)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {pickerField === 'from' ? 'Select Start Time' : 'Select End Time'}
            </Text>
            <FlatList
              data={pickerField === 'to' ? endTimeOptions : startTimeOptions}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              style={styles.modalList}
              renderItem={({ item }) => {
                const isSelected = pickerField === 'from' ? rangeStart === item : rangeEnd === item
                return (
                  <Pressable
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      if (pickerField === 'from') {
                        setRangeStart(item)
                        setRangeEnd(null)
                      } else {
                        setRangeEnd(item)
                      }
                      setPickerField(null)
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                      {item}
                    </Text>
                    {isSelected && <MaterialIcons name="check" size={20} color={TINT} />}
                  </Pressable>
                )
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  },
  scroll: {
    paddingHorizontal: 20,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calendarNavBtn: {
    padding: 4,
  },
  calendarMonthLabel: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'center',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: TINT,
  },
  dayCellToday: {
    backgroundColor: TINT_LIGHT,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayTextPast: {
    opacity: 0.3,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },

  slotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: DANGER,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: TINT_LIGHT,
    borderWidth: 1,
    borderColor: TINT + '30',
    width: '100%',
  },
  slotChipPartial: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F59E0B' + '40',
  },
  slotChipFull: {
    backgroundColor: '#FEE2E2',
    borderColor: DANGER + '30',
  },
  slotChipTime: {
    fontSize: 13,
    fontWeight: '700',
    color: TINT,
  },
  slotChipTimeFull: {
    color: '#9CA3AF',
  },
  slotChipCount: {
    fontSize: 11,
    color: TINT + '99',
    marginTop: 1,
  },
  slotChipCountFull: {
    color: DANGER + '99',
  },
  slotDeleteBtn: {
    padding: 4,
  },
  fullBadge: {
    backgroundColor: DANGER + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fullBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DANGER,
  },

  rangeHint: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },

  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 0,
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownFilled: {
    borderColor: TINT,
    backgroundColor: TINT_LIGHT,
  },
  dropdownDisabled: {
    opacity: 0.4,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  dropdownDivider: {
    paddingHorizontal: 10,
    paddingBottom: 14,
  },

  previewSection: {
    marginTop: 18,
    padding: 14,
    backgroundColor: TINT_LIGHT,
    borderRadius: 12,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: TINT + '30',
  },
  previewChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: TINT,
  },

  addBtn: {
    backgroundColor: TINT,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '50%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  modalList: {
    flexGrow: 0,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  modalItemActive: {
    backgroundColor: TINT_LIGHT,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  modalItemText: {
    fontSize: 15,
    color: '#374151',
  },
  modalItemTextActive: {
    color: TINT,
    fontWeight: '700',
  },
})
