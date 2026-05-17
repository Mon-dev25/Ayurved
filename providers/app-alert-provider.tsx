import { registerAppAlertListener, type AppAlertButton, type AppAlertPayload } from '@/lib/app-alert'
import { PropsWithChildren, useCallback, useEffect, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

const TINT = '#6050D0'

export default function AppAlertProvider({ children }: PropsWithChildren) {
  const [alert, setAlert] = useState<AppAlertPayload | null>(null)

  const dismiss = useCallback(() => setAlert(null), [])

  useEffect(() => {
    registerAppAlertListener((payload) => setAlert(payload))
    return () => registerAppAlertListener(null)
  }, [])

  const handlePress = (btn: AppAlertButton) => {
    dismiss()
    btn.onPress?.()
  }

  const singleButton = (alert?.buttons?.length ?? 0) === 1

  return (
    <>
      {children}
      <Modal visible={!!alert} transparent animationType="fade" onRequestClose={dismiss}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            {!!alert?.title && <Text style={styles.title}>{alert.title}</Text>}
            {!!alert?.message && <Text style={styles.message}>{alert.message}</Text>}
            <View style={[styles.actions, singleButton && styles.actionsSingle]}>
              {alert?.buttons.map((btn, i) => (
                <Pressable
                  key={`${btn.text}-${i}`}
                  style={({ pressed }) => [
                    styles.btn,
                    singleButton && styles.btnSingle,
                    btn.style === 'destructive' && styles.btnDestructive,
                    btn.style === 'cancel' && styles.btnCancel,
                    (!btn.style || btn.style === 'default') && styles.btnPrimary,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => handlePress(btn)}
                >
                  <Text
                    style={[
                      styles.btnText,
                      btn.style === 'destructive' && styles.btnTextDestructive,
                      btn.style === 'cancel' && styles.btnTextCancel,
                      (!btn.style || btn.style === 'default') && styles.btnTextPrimary,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  message: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 14 },
  actions: { gap: 10, alignSelf: 'stretch' },
  actionsSingle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  btn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    alignSelf: 'stretch',
  },
  btnSingle: {
    alignSelf: 'center',
    minWidth: 100,
    paddingHorizontal: 28,
  },
  btnPrimary: { backgroundColor: TINT, borderColor: TINT },
  btnCancel: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  btnDestructive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  btnText: { fontSize: 15, fontWeight: '700' },
  btnTextPrimary: { color: '#fff' },
  btnTextCancel: { color: '#111827' },
  btnTextDestructive: { color: '#B91C1C' },
})
