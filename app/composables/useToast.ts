import { ref } from 'vue'

export interface Toast {
  id: number
  text: string
  variant: 'info' | 'success' | 'warning' | 'danger'
  durationMs: number
}

const toasts = ref<Toast[]>([])
let nextId = 1

export function useToasts() {
  function push(text: string, variant: Toast['variant'] = 'info', durationMs = 2200) {
    const t: Toast = { id: nextId++, text, variant, durationMs }
    toasts.value.push(t)
    setTimeout(() => dismiss(t.id), durationMs)
  }
  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }
  return { toasts, push, dismiss }
}
