import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { getFeatureDeckApiKey } from '@/lib/featuredeck-config'
import {
  FeatureDeck,
  createThemeFromColor,
  darkTheme,
  lightTheme,
  mergeTheme,
} from '@featuredeck/react-native'
import { useEffect, useRef } from 'react'

const PRIMARY = '#6050D0'

export function FeatureDeckSync() {
  const colorScheme = useColorScheme()
  const { isLoggedIn, profile } = useAuthContext()
  const initPromiseRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    const apiKey = getFeatureDeckApiKey()
    if (!apiKey) return

    const isDark = colorScheme === 'dark'
    const base = isDark ? darkTheme : lightTheme
    const accent = createThemeFromColor(PRIMARY, isDark)
    const theme = mergeTheme(base, accent)

    if (!initPromiseRef.current) {
      initPromiseRef.current = FeatureDeck.init({ apiKey, theme })
    }

    let cancelled = false
    void (async () => {
      await initPromiseRef.current
      if (cancelled || !FeatureDeck.isReady()) return
      FeatureDeck.setTheme(theme)
    })()

    return () => {
      cancelled = true
    }
  }, [colorScheme])

  useEffect(() => {
    const apiKey = getFeatureDeckApiKey()
    if (!apiKey) return

    let cancelled = false
    void (async () => {
      await initPromiseRef.current
      if (cancelled || !FeatureDeck.isReady()) return

      if (!isLoggedIn || !profile?.id) {
        await FeatureDeck.setUser(null)
        return
      }

      await FeatureDeck.setUser({
        externalUserId: profile.id,
        username: profile.full_name ?? profile.username ?? undefined,
        email: profile.email ?? undefined,
      })
    })()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, profile?.id, profile?.full_name, profile?.username, profile?.email])

  return null
}
