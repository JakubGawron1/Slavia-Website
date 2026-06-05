export function useBrowserNotifications() {
  const storageKey = 'slavia-system-notifications'
  const enabled = useState<boolean>('systemNotificationsEnabled', () => false)
  const permission = ref<NotificationPermission>('default')
  const supported = import.meta.client && 'Notification' in window && 'serviceWorker' in navigator
  const hasPermission = computed(() => permission.value === 'granted')

  function loadState() {
    if (!import.meta.client) return
    permission.value = 'Notification' in window ? Notification.permission : 'default'
    const stored = localStorage.getItem(storageKey)
    enabled.value = stored === 'true'
  }

  function setEnabled(value: boolean) {
    enabled.value = value
    if (!import.meta.client) return
    localStorage.setItem(storageKey, String(value))
  }

  async function requestPermission() {
    if (!supported) return 'default'
    try {
      const result = await Notification.requestPermission()
      permission.value = result
      return result
    } catch {
      permission.value = 'denied'
      return 'denied'
    }
  }

  function notify(title: string, options?: NotificationOptions) {
    if (!import.meta.client || !supported || !enabled.value || permission.value !== 'granted') return
    try {
      const notification = new Notification(title, options)
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch {
      // Ignore failures in unsupported environments
    }
  }

  onMounted(loadState)

  return {
    enabled,
    permission,
    supported,
    hasPermission,
    requestPermission,
    setEnabled,
    notify
  }
}
