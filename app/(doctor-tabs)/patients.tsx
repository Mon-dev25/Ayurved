import { StyleSheet } from 'react-native'

import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'

export default function PatientsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Patients</ThemedText>
      <ThemedText style={styles.subtitle}>Your patient list</ThemedText>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  subtitle: {
    opacity: 0.6,
    fontSize: 16,
  },
})
