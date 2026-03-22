import { Tabs } from 'expo-router'
import React from 'react'

import { FloatingTabBar } from '@/components/floating-tab-bar'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { useAppointmentNotifications } from '@/hooks/use-appointment-notifications'

export default function PatientTabLayout() {
  useAppointmentNotifications()

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <IconSymbol size={size} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <IconSymbol size={size} name="list.clipboard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <IconSymbol size={size} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  )
}
