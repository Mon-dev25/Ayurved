import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useThemeColor } from '@/hooks/use-theme-color'

const TINT = '#5B6BF5'
const TINT_LIGHT = '#EEF0FF'
const DAY_LABELS = ['S', 'S', 'M', 'T', 'W', 'T', 'F']

const TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets()
  const textColor = useThemeColor({}, 'text')
  const bgColor = useThemeColor({}, 'background')
  const subtextColor = useThemeColor({}, 'icon')

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'appointments' | 'details' | 'reviews'>('appointments')

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

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
    setSelectedDay(null)
    setSelectedTime(null)
  }

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
    setSelectedDay(null)
    setSelectedTime(null)
  }

  const handleBook = () => {
    if (!selectedDay || !selectedTime) {
      Alert.alert('Select date & time', 'Please pick both a date and time slot.')
      return
    }
    Alert.alert(
      'Confirm Booking',
      `Book appointment on ${MONTH_NAMES[viewMonth]} ${selectedDay}, ${viewYear} at ${selectedTime}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => Alert.alert('Booked!', 'Your appointment has been confirmed.') },
      ],
    )
  }

  return (
    <View style={[styles.root, { backgroundColor: TINT_LIGHT }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Header */}
        <View style={styles.doctorHeader}>
          <View style={styles.doctorAvatarLarge}>
            <MaterialIcons name="person" size={48} color={TINT} />
          </View>
          <Text style={styles.doctorName}>Dr. Ayur Vaidya</Text>
          <Text style={styles.doctorSpec}>Ayurvedic Physician</Text>
          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={16} color="#FFC107" />
            <MaterialIcons name="star" size={16} color="#FFC107" />
            <MaterialIcons name="star" size={16} color="#FFC107" />
            <MaterialIcons name="star" size={16} color="#FFC107" />
            <MaterialIcons name="star-half" size={16} color="#FFC107" />
            <Text style={styles.ratingValue}>4.8</Text>
          </View>
        </View>

        {/* Stats Row */}
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

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          {(['appointments', 'details', 'reviews'] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'appointments' && (
          <>
            {/* Calendar */}
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
                        onPress={() => {
                          if (day && !past) {
                            setSelectedDay(day)
                            setSelectedTime(null)
                          }
                        }}
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

            {/* Time Slots */}
            {selectedDay !== null && (
              <View style={[styles.timeCard, { backgroundColor: bgColor }]}>
                <View style={styles.calendarHeader}>
                  <Text style={[styles.calendarTitle, { color: textColor }]}>Choose Time</Text>
                </View>
                <View style={styles.timeSlotsWrap}>
                  {TIME_SLOTS.map((slot) => {
                    const active = selectedTime === slot
                    return (
                      <Pressable
                        key={slot}
                        style={[styles.timeChip, active && styles.timeChipActive]}
                        onPress={() => setSelectedTime(slot)}
                      >
                        <Text style={[styles.timeChipText, { color: textColor }, active && styles.timeChipTextActive]}>
                          {slot}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )}

            {/* Book Button */}
            <Pressable
              style={[styles.bookBtn, !(selectedDay && selectedTime) && styles.bookBtnDisabled]}
              onPress={handleBook}
            >
              <Text style={styles.bookBtnText}>Book Appointment</Text>
            </Pressable>
          </>
        )}

        {activeTab === 'details' && (
          <View style={[styles.placeholderCard, { backgroundColor: bgColor }]}>
            <Text style={[styles.placeholderText, { color: subtextColor }]}>
              Doctor details coming soon.
            </Text>
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={[styles.placeholderCard, { backgroundColor: bgColor }]}>
            <Text style={[styles.placeholderText, { color: subtextColor }]}>
              Reviews coming soon.
            </Text>
          </View>
        )}
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

  // Doctor Header
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

  // Stats
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

  // Tabs
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  tabBtnActive: {
    backgroundColor: TINT,
    borderColor: TINT,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#fff',
  },

  // Calendar
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

  // Time Slots
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
  timeSlotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
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

  // Placeholder
  placeholderCard: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 15,
  },

  // Book Button
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
