import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { scheduleAppointmentReminder } from '@/hooks/use-appointment-notifications'
import { useAuthContext } from '@/hooks/use-auth-context'
import { useDoctorContext } from '@/hooks/use-doctor-context'
import { useThemeColor } from '@/hooks/use-theme-color'
import { supabase } from '@/lib/supabase.web'

const TINT = '#6050D0'
const TINT_LIGHT = '#E0E0F0'
const DAY_LABELS = ['S', 'S', 'M', 'T', 'W', 'T', 'F']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MAX_BOOKINGS_PER_SLOT = 3

type Slot = {
  id: number
  doctor_id: string
  start_ts: string
  end_ts: string
  status: string
  spots_left: number
}

type Booking = {
  id: number
  slot_id: number
  scheduled_at: string
  status: string
}

type CalendarView = {
  year: number
  month: number
  selectedDay: number | null
}

function formatTime(iso: string) {
  const d = new Date(iso)
  let h = d.getHours()
  const m = d.getMinutes()
  const period = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const DayCell = React.memo(function DayCell({
  day,
  isPast,
  isToday,
  isSelected,
  textColor,
  onPress,
}: {
  day: number | null
  isPast: boolean
  isToday: boolean
  isSelected: boolean
  textColor: string
  onPress: (day: number) => void
}) {
  return (
    <Pressable
      style={[
        styles.dayCell,
        isSelected && styles.dayCellSelected,
        isToday && !isSelected && styles.dayCellToday,
      ]}
      onPress={() => { if (day && !isPast) onPress(day) }}
      disabled={!day || isPast}
    >
      {day !== null && (
        <Text
          style={[
            styles.dayText,
            { color: textColor },
            isPast && styles.dayTextPast,
            isSelected && styles.dayTextSelected,
          ]}
        >
          {day}
        </Text>
      )}
    </Pressable>
  )
})

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { profile } = useAuthContext()
  const { selectedDoctor } = useDoctorContext()
  const textColor = useThemeColor({}, 'text')
  const bgColor = useThemeColor({}, 'background')
  const subtextColor = useThemeColor({}, 'icon')

  const today = useMemo(() => new Date(), [])
  const todayDate = today.getDate()
  const todayMonth = today.getMonth()
  const todayYear = today.getFullYear()

  const [view, setView] = useState<CalendarView>({
    year: todayYear,
    month: todayMonth,
    selectedDay: todayDate,
  })
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [booking, setBooking] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slots, setSlots] = useState<Slot[]>([])
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
  const [loadingBooking, setLoadingBooking] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  const doctorId = selectedDoctor?.id ?? null
  const { year: viewYear, month: viewMonth, selectedDay } = view

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth])
  const firstDay = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth), [viewYear, viewMonth])

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [firstDay, daysInMonth])

  const pastDays = useMemo(() => {
    const set = new Set<number>()
    if (viewYear < todayYear || (viewYear === todayYear && viewMonth < todayMonth)) {
      for (let d = 1; d <= daysInMonth; d++) set.add(d)
    } else if (viewYear === todayYear && viewMonth === todayMonth) {
      for (let d = 1; d < todayDate; d++) set.add(d)
    }
    return set
  }, [viewYear, viewMonth, daysInMonth, todayYear, todayMonth, todayDate])

  const todayInView = viewYear === todayYear && viewMonth === todayMonth ? todayDate : null

  const bookingIsInPast = activeBooking
    ? new Date(activeBooking.scheduled_at) < today
    : false

  const showCalendar = !activeBooking || bookingIsInPast

  const fetchActiveBooking = useCallback(async () => {
    if (!profile?.id || !doctorId) {
      setLoadingBooking(false)
      return
    }

    const { data } = await supabase
      .from('appointments')
      .select('id, slot_id, scheduled_at, status')
      .eq('patient_id', profile.id)
      .eq('doctor_id', doctorId)
      .eq('status', 'booked')
      .gte('scheduled_at', today.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    console.log("🚀 ~ ScheduleScreen ~ data:", data)

    setActiveBooking(data ?? null)
    setLoadingBooking(false)
  }, [profile?.id, doctorId, today])

  const fetchSlots = useCallback(async (day: number) => {
    if (!doctorId) return

    setLoadingSlots(true)
    setSlots([])

    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayEnd = `${dateStr}T23:59:59`

    const isViewingToday = viewYear === todayYear && viewMonth === todayMonth && day === todayDate
    const dayStart = isViewingToday ? new Date().toISOString() : `${dateStr}T00:00:00`

    const { data, error } = await supabase
      .from('doctor_slots')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('status', 'available')
      .gte('start_ts', dayStart)
      .lte('start_ts', dayEnd)
      .order('start_ts', { ascending: true })

    if (error) {
      setLoadingSlots(false)
      console.warn('Failed to fetch slots:', error.message)
      return
    }

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

    const available: Slot[] = slotRows
      .map((s: any) => ({
        ...s,
        spots_left: MAX_BOOKINGS_PER_SLOT - (countMap[s.id] ?? 0),
      }))
      .filter((s: Slot) => s.spots_left > 0)

    setLoadingSlots(false)
    setSlots(available)
  }, [doctorId, viewYear, viewMonth])

  useEffect(() => {
    const init = async () => {
      const promises: Promise<void>[] = [fetchActiveBooking()]
      if (selectedDay !== null) {
        promises.push(fetchSlots(selectedDay))
      }
      await Promise.all(promises)
    }
    init()
    // Only run on mount — subsequent day/month changes handled by the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (showCalendar && selectedDay !== null) {
      fetchSlots(selectedDay)
    }
  }, [fetchSlots, selectedDay, showCalendar])

  const handleDayPress = useCallback((day: number) => {
    setView(v => ({ ...v, selectedDay: day }))
    setSelectedSlot(null)
  }, [])

  const goToPrevMonth = useCallback(() => {
    setView(v => ({
      year: v.month === 0 ? v.year - 1 : v.year,
      month: v.month === 0 ? 11 : v.month - 1,
      selectedDay: null,
    }))
    setSelectedSlot(null)
    setSlots([])
  }, [])

  const goToNextMonth = useCallback(() => {
    setView(v => ({
      year: v.month === 11 ? v.year + 1 : v.year,
      month: v.month === 11 ? 0 : v.month + 1,
      selectedDay: null,
    }))
    setSelectedSlot(null)
    setSlots([])
  }, [])

  const confirmBooking = useCallback(async () => {
    if (!selectedSlot || !profile?.id) return

    setBooking(true)

    const { error } = await supabase.from('appointments').insert({
      patient_id: profile.id,
      doctor_id: selectedSlot.doctor_id,
      slot_id: selectedSlot.id,
      scheduled_at: selectedSlot.start_ts,
      status: 'booked',
    })

    if (error) {
      setBooking(false)
      Alert.alert('Booking Failed', error.message)
      return
    }

    const [countResult] = await Promise.all([
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('slot_id', selectedSlot.id),
      scheduleAppointmentReminder({
        id: Date.now(),
        scheduled_at: selectedSlot.start_ts,
        doctor_name: selectedDoctor?.full_name,
      }),
    ])

    if ((countResult.count ?? 0) >= MAX_BOOKINGS_PER_SLOT) {
      await supabase
        .from('doctor_slots')
        .update({ status: 'booked' })
        .eq('id', selectedSlot.id)
    }

    setBooking(false)
    setSelectedSlot(null)
    setActiveBooking({
      id: Date.now(),
      slot_id: selectedSlot.id,
      scheduled_at: selectedSlot.start_ts,
      status: 'booked',
    })
  }, [selectedSlot, profile?.id, selectedDoctor?.full_name])

  const handleBook = useCallback(() => {
    if (!selectedDay || !selectedSlot) {
      Alert.alert('Select date & time', 'Please pick both a date and time slot.')
      return
    }
    const label = formatTime(selectedSlot.start_ts)
    Alert.alert(
      'Confirm Booking',
      `Book appointment on ${MONTH_NAMES[viewMonth]} ${selectedDay}, ${viewYear} at ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: confirmBooking },
      ],
    )
  }, [selectedDay, selectedSlot, viewMonth, viewYear, confirmBooking])

  const handleCancelBooking = useCallback(() => {
    if (!activeBooking) return
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true)

            await Promise.all([
              supabase.from('appointments').update({ status: 'cancelled' }).eq('id', activeBooking.id),
              supabase.from('doctor_slots').update({ status: 'available' }).eq('id', activeBooking.slot_id),
            ])

            setActiveBooking(null)
            setCancelling(false)
            setView(v => ({ ...v, selectedDay: todayDate }))
          },
        },
      ],
    )
  }, [activeBooking, todayDate])

  if (loadingBooking) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: TINT_LIGHT }]}>
        <ActivityIndicator color={TINT} size="large" />
      </View>
    )
  }

  return (
    <View style={[styles.root, { backgroundColor: TINT_LIGHT }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={TINT} />
        </Pressable>
        <Text style={styles.topBarTitle}>Book Appointment</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.doctorHeader}>
          <View style={styles.doctorAvatarLarge}>
            <MaterialIcons name="person" size={48} color={TINT} />
          </View>
          <Text style={styles.doctorName}>{selectedDoctor?.full_name ?? 'Doctor'}</Text>
          {selectedDoctor?.specialty ? (
            <Text style={styles.doctorSpec}>{selectedDoctor.specialty}</Text>
          ) : null}
          {selectedDoctor?.rating != null && (
            <View style={styles.ratingRow}>
              <MaterialIcons name="star" size={16} color="#FFC107" />
              <Text style={styles.ratingValue}>{selectedDoctor.rating}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: bgColor }]}>
            <Text style={[styles.statValue, { color: textColor }]}>10y+</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Experience</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: bgColor }]}>
            <Text style={[styles.statValue, { color: textColor }]}>2.5k</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Reviews</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: bgColor }]}>
            <Text style={[styles.statValue, { color: textColor }]}>$70</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Fee's</Text>
          </View>
        </View>

        {activeBooking && !bookingIsInPast && (
          <View style={[styles.bookedCard, { backgroundColor: bgColor }]}>
            <View style={styles.bookedIconWrap}>
              <MaterialIcons name="event-available" size={40} color={TINT} />
            </View>
            <Text style={styles.bookedTitle}>Appointment Booked</Text>
            <Text style={styles.bookedSubtext}>
              Your appointment with {selectedDoctor?.full_name ?? 'the doctor'} is confirmed.
            </Text>

            <View style={styles.bookedDetailsRow}>
              <View style={styles.bookedDetail}>
                <MaterialIcons name="calendar-today" size={16} color={TINT} />
                <Text style={styles.bookedDetailText}>
                  {formatFullDate(activeBooking.scheduled_at)}
                </Text>
              </View>
              <View style={styles.bookedDetail}>
                <MaterialIcons name="schedule" size={16} color={TINT} />
                <Text style={styles.bookedDetailText}>
                  {formatTime(activeBooking.scheduled_at)}
                </Text>
              </View>
            </View>

            <View style={styles.bookedStatusBadge}>
              <MaterialIcons name="check-circle" size={14} color="#16A34A" />
              <Text style={styles.bookedStatusText}>Confirmed</Text>
            </View>

            <Pressable
              style={[styles.cancelBookingBtn, cancelling && { opacity: 0.6 }]}
              onPress={handleCancelBooking}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color="#EF4444" size="small" />
              ) : (
                <>
                  <MaterialIcons name="close" size={16} color="#EF4444" />
                  <Text style={styles.cancelBookingText}>Cancel Appointment</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {activeBooking && bookingIsInPast && (
          <View style={[styles.pastNotice, { backgroundColor: bgColor }]}>
            <MaterialIcons name="info-outline" size={18} color="#9CA3AF" />
            <Text style={styles.pastNoticeText}>
              Your previous appointment on {formatFullDate(activeBooking.scheduled_at)} has passed. Book a new one below.
            </Text>
          </View>
        )}

        {showCalendar && (
          <>
            <View style={[styles.calendarCard, { backgroundColor: bgColor }]}>
              <View style={styles.calendarHeader}>
                <Text style={[styles.calendarTitle, { color: textColor }]}>Choose Date</Text>
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
                  {calendarCells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, cellIdx) => (
                    <DayCell
                      key={cellIdx}
                      day={day}
                      isPast={day !== null && pastDays.has(day)}
                      isToday={day === todayInView}
                      isSelected={day === selectedDay && day !== null}
                      textColor={textColor}
                      onPress={handleDayPress}
                    />
                  ))}
                </View>
              ))}
            </View>

            {selectedDay !== null && (
              <View style={[styles.timeCard, { backgroundColor: bgColor }]}>
                <View style={styles.calendarHeader}>
                  <Text style={[styles.calendarTitle, { color: textColor }]}>Choose Time</Text>
                </View>
                {loadingSlots ? (
                  <ActivityIndicator color={TINT} style={{ paddingVertical: 20 }} />
                ) : slots.length === 0 ? (
                  <Text style={[styles.noSlotsText, { color: subtextColor }]}>
                    No available slots for this date.
                  </Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timeSlotsScroll}
                  >
                    {slots.map((slot) => {
                      const active = selectedSlot?.id === slot.id
                      return (
                        <Pressable
                          key={slot.id}
                          style={[styles.timeChip, active && styles.timeChipActive]}
                          onPress={() => setSelectedSlot(slot)}
                        >
                          <Text style={[styles.timeChipText, { color: textColor }, active && styles.timeChipTextActive]}>
                            {formatTime(slot.start_ts)}
                          </Text>
                          <Text style={[styles.spotsText, active && styles.spotsTextActive]}>
                            {slot.spots_left} {slot.spots_left === 1 ? 'spot' : 'spots'}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </ScrollView>
                )}
              </View>
            )}

            <Pressable
              style={[styles.bookBtn, (!(selectedDay && selectedSlot) || booking) && styles.bookBtnDisabled]}
              onPress={handleBook}
              disabled={booking}
            >
              {booking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bookBtnText}>Book Appointment</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TINT,
  },
  spacer: {
    width: 40,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  doctorHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  doctorAvatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  doctorSpec: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  bookedCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  bookedIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bookedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  bookedSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  bookedDetailsRow: {
    gap: 10,
    marginBottom: 16,
  },
  bookedDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookedDetailText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  bookedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  bookedStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  cancelBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  cancelBookingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  pastNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  pastNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  calendarCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
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
  timeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noSlotsText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  timeSlotsScroll: {
    gap: 10,
    paddingRight: 8,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center' as const,
  },
  timeChipActive: {
    backgroundColor: TINT,
    borderColor: TINT,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: '#fff',
  },
  spotsText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  spotsTextActive: {
    color: '#ffffffCC',
  },
  bookBtn: {
    backgroundColor: TINT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnDisabled: {
    opacity: 0.5,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})