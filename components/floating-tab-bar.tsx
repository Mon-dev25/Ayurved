import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import * as Haptics from 'expo-haptics'
import { Platform, Pressable, StyleSheet, View } from 'react-native'

const TINT = '#6050D0'

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index

          const onPress = () => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key })
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : undefined}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              {options.tabBarIcon?.({ focused: isFocused, color: isFocused ? TINT : '#9CA3AF', size: 26 })}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    alignItems: 'center'
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: '#F3EFFF',
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    width: 300,
    justifyContent: 'space-around'
  },
 tab: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 6,
  paddingHorizontal: 16,   // controls spacing between icons
  minWidth: 56,            // ensures each icon has enough room
}
})
