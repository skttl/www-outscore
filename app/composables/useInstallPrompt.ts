import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStorage } from '@vueuse/core'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  prompt: () => Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const dismissedAt = useStorage<number>('stregespil-install-dismissed-at', 0)
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari
  if ((window.navigator as any).standalone === true) return true
  return false
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // Includes any iOS browser - we'll detect the specific one via iosBrowserName
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document)
}

function iosBrowserName(): string | null {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  if (/CriOS\//.test(ua)) return 'Chrome'
  if (/FxiOS\//.test(ua)) return 'Firefox'
  if (/EdgiOS\//.test(ua)) return 'Edge'
  if (/OPiOS\//.test(ua)) return 'Opera'
  if (/Safari\//.test(ua)) return 'Safari'
  return null
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}

export function useInstallPrompt() {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
  const installed = ref(isStandalone())
  const isIOSDevice = ref(isIOS())
  const isAndroidDevice = ref(isAndroid())
  const iosBrowser = ref(iosBrowserName())

  function onBeforeInstall(e: Event) {
    e.preventDefault()
    deferredPrompt.value = e as BeforeInstallPromptEvent
  }

  function onAppInstalled() {
    installed.value = true
    deferredPrompt.value = null
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    window.removeEventListener('appinstalled', onAppInstalled)
  })

  const recentlyDismissed = computed(
    () => Date.now() - dismissedAt.value < DISMISS_COOLDOWN_MS,
  )

  /** Banner should be shown if not installed, not dismissed recently, and there's something to act on */
  const shouldShow = computed(() => {
    if (installed.value) return false
    if (recentlyDismissed.value) return false
    // Either we have a deferred prompt (Chrome/Edge/Android) or it's iOS (manual instructions)
    return !!deferredPrompt.value || isIOSDevice.value
  })

  async function promptInstall() {
    const e = deferredPrompt.value
    if (!e) return null
    await e.prompt()
    const choice = await e.userChoice
    deferredPrompt.value = null
    if (choice.outcome === 'dismissed') dismissedAt.value = Date.now()
    return choice.outcome
  }

  function dismiss() {
    dismissedAt.value = Date.now()
  }

  return {
    shouldShow,
    installed,
    deferredPrompt,
    isIOS: isIOSDevice,
    isAndroid: isAndroidDevice,
    iosBrowser,
    promptInstall,
    dismiss,
  }
}
