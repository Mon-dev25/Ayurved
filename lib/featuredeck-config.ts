import Constants from 'expo-constants'

type Extra = { featuredeckApiKey?: string }

export function getFeatureDeckApiKey(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_FEATUREDECK_API_KEY?.trim()
  if (fromEnv) return fromEnv

  const extra = Constants.expoConfig?.extra as Extra | undefined
  const fromExtra = extra?.featuredeckApiKey?.trim()
  if (fromExtra) return fromExtra

  return undefined
}
