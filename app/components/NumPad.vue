<script setup lang="ts">
const props = defineProps<{
  value: string
  maxScore: number
  disabled?: boolean
  okLabel?: string
}>()

const emit = defineEmits<{
  (e: 'update:value', v: string): void
  (e: 'submit'): void
}>()

const QUICK_VALUES = [60, 100, 140, 180]

function append(digit: string) {
  if (props.disabled) return
  let next = (props.value === '0' || props.value === '') ? digit : props.value + digit
  if (next.length > 3) return
  const n = parseInt(next, 10)
  if (Number.isNaN(n)) return
  if (n > props.maxScore) return
  emit('update:value', next)
}

function backspace() {
  if (props.disabled) return
  const next = props.value.length <= 1 ? '0' : props.value.slice(0, -1)
  emit('update:value', next)
}

function setQuick(v: number) {
  if (props.disabled) return
  if (v > props.maxScore) return
  emit('update:value', String(v))
}

function clearVal() {
  if (props.disabled) return
  emit('update:value', '0')
}

function ok() {
  if (props.disabled) return
  emit('submit')
}

const padBtn =
  'flex items-center justify-center rounded-xl bg-[var(--color-surface-2)] active:bg-[var(--color-surface)] active:scale-95 transition-transform text-2xl font-semibold no-select'
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Quick scores row -->
    <div class="grid grid-cols-4 gap-2">
      <button
        v-for="q in QUICK_VALUES"
        :key="q"
        type="button"
        :class="[
          'h-12 rounded-lg border border-[var(--color-border)] text-base font-semibold transition no-select',
          q > maxScore || disabled
            ? 'opacity-40'
            : 'bg-[var(--color-surface)] active:scale-95',
        ]"
        :disabled="q > maxScore || disabled"
        @click="setQuick(q)"
      >
        {{ q }}
      </button>
    </div>

    <!-- Number pad -->
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
        :key="n"
        type="button"
        :class="[padBtn, 'h-14']"
        :disabled="disabled"
        @click="append(String(n))"
      >
        {{ n }}
      </button>
      <button type="button" :class="[padBtn, 'h-14 text-xl']" :disabled="disabled" @click="clearVal">
        C
      </button>
      <button type="button" :class="[padBtn, 'h-14']" :disabled="disabled" @click="append('0')">
        0
      </button>
      <button type="button" :class="[padBtn, 'h-14 text-xl']" :disabled="disabled" @click="backspace">
        ⌫
      </button>
    </div>

    <button
      type="button"
      :disabled="disabled"
      :class="[
        'h-14 rounded-xl text-xl font-bold no-select transition',
        disabled
          ? 'bg-[var(--color-surface-2)] text-[var(--color-muted)] opacity-50'
          : 'bg-[var(--color-accent)] text-[var(--color-accent-fg)] active:scale-95',
      ]"
      @click="ok"
    >
      {{ okLabel || 'OK' }}
    </button>
  </div>
</template>
