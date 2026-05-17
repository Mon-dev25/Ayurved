export type AppAlertButtonStyle = 'default' | 'cancel' | 'destructive'

export type AppAlertButton = {
  text: string
  onPress?: () => void
  style?: AppAlertButtonStyle
}

export type AppAlertPayload = {
  title: string
  message?: string
  buttons: AppAlertButton[]
}

type Listener = (payload: AppAlertPayload) => void

let listener: Listener | null = null

export function registerAppAlertListener(fn: Listener | null) {
  listener = fn
}

/** Same shape as `Alert.alert` — shows the global Ayur-styled modal. */
export function showAppAlert(title: string, message?: string, buttons?: AppAlertButton[]) {
  const resolved = buttons?.length ? buttons : [{ text: 'OK' }]
  listener?.({ title, message, buttons: resolved })
}
