import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { useCallback, useEffect, useRef } from 'react'

import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase.web'

const REMINDER_MINUTES_BEFORE = 60

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false

  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function scheduleAppointmentReminder(appointment: {
  id: number
  scheduled_at: string
  doctor_name?: string
}): Promise<string | null> {
  const appointmentDate = new Date(appointment.scheduled_at)
  const triggerDate = new Date(appointmentDate.getTime() - REMINDER_MINUTES_BEFORE * 60 * 1000)

  if (triggerDate.getTime() <= Date.now()) return null

  const hours = appointmentDate.getHours()
  const minutes = appointmentDate.getMinutes()
  const period = hours >= 12 ? 'PM' : 'AM'
  const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  const timeStr = `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`

  const doctorLabel = appointment.doctor_name ?? 'your doctor'

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Appointment Reminder',
      body: `Your appointment with ${doctorLabel} is in 1 hour (${timeStr}). Please be ready!`,
      data: { appointmentId: appointment.id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  })

  return notificationId
}

export async function cancelAppointmentReminder(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId)
}

export function useAppointmentNotifications() {
  const { profile, role } = useAuthContext()
  const synced = useRef(false)

  const syncUpcomingReminders = useCallback(async () => {
    if (!profile?.id || role !== 'patient') return

    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    await Notifications.cancelAllScheduledNotificationsAsync()

    const now = new Date().toISOString()
    const { data: rows } = await supabase
      .from('appointments')
      .select('id, scheduled_at, doctor_id, status')
      .eq('patient_id', profile.id)
      .in('status', ['booked', 'confirmed'])
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })

    if (!rows || rows.length === 0) return

    const doctorIds = [...new Set(rows.map((r: any) => r.doctor_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', doctorIds)

    const nameMap: Record<string, string> = {}
    ;(profiles ?? []).forEach((p: any) => {
      nameMap[p.id] = p.full_name ?? 'Doctor'
    })

    for (const appt of rows) {
      await scheduleAppointmentReminder({
        id: appt.id,
        scheduled_at: appt.scheduled_at,
        doctor_name: nameMap[appt.doctor_id],
      })
    }
  }, [profile?.id, role])

  useEffect(() => {
    if (synced.current || !profile?.id || role !== 'patient') return
    synced.current = true
    syncUpcomingReminders()
  }, [profile?.id, role, syncUpcomingReminders])

  return { syncUpcomingReminders, requestPermissions }
}
