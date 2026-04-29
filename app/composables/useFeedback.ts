/**
 * Lightweight audio + haptic feedback using WebAudio (no asset files needed).
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      ctx = new AC()
    } catch {
      ctx = null
    }
  }
  return ctx
}

function tone(freq: number, durationMs: number, type: OscillatorType = 'sine', volume = 0.2) {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.value = 0
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + durationMs / 1000)
  osc.connect(gain).connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + durationMs / 1000)
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {}
  }
}

async function sequence(notes: Array<[number, number]>) {
  for (const [freq, dur] of notes) {
    tone(freq, dur, 'triangle', 0.18)
    await new Promise(r => setTimeout(r, dur))
  }
}

export const feedback = {
  miss() {
    tone(180, 120, 'sawtooth', 0.15)
    vibrate(40)
  },
  lostLife() {
    tone(140, 220, 'square', 0.18)
    vibrate([60, 30, 60])
  },
  steal() {
    sequence([[440, 80], [660, 120]])
    vibrate([30, 20, 60])
  },
  refill() {
    sequence([[523, 80], [659, 80], [784, 80], [1047, 160]])
    vibrate([50, 30, 50, 30, 100])
  },
  eliminated() {
    sequence([[330, 120], [262, 200], [196, 320]])
    vibrate([80, 40, 80, 40, 200])
  },
  highlight() {
    tone(880, 80, 'sine', 0.12)
    vibrate(20)
  },
  click() {
    tone(660, 30, 'sine', 0.08)
  },
  win() {
    sequence([[523, 100], [659, 100], [784, 100], [1047, 240]])
    vibrate([100, 50, 100, 50, 200])
  },
}

let wakeLock: WakeLockSentinel | null = null

export async function requestWakeLock(): Promise<void> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
  try {
    wakeLock = await (navigator as any).wakeLock.request('screen')
    wakeLock?.addEventListener('release', () => {
      wakeLock = null
    })
  } catch {
    wakeLock = null
  }
}

export async function releaseWakeLock(): Promise<void> {
  try {
    await wakeLock?.release()
  } catch {}
  wakeLock = null
}

export function setupWakeLockReacquire(isActive: () => boolean) {
  if (typeof document === 'undefined') return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isActive()) {
      requestWakeLock()
    }
  })
}
