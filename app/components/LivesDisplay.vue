<script setup lang="ts">
const props = defineProps<{
  lives: number
  startLives: number
  size?: 'sm' | 'md' | 'lg'
}>()

const sizeClasses = computed(() => {
  switch (props.size || 'md') {
    case 'sm':
      return { num: 'text-base', heart: 'text-base', bar: 'h-1.5' }
    case 'lg':
      return { num: 'text-4xl', heart: 'text-2xl', bar: 'h-3' }
    default:
      return { num: 'text-2xl', heart: 'text-xl', bar: 'h-2' }
  }
})

const pct = computed(() =>
  Math.max(0, Math.min(100, (props.lives / Math.max(1, props.startLives)) * 100)),
)

const barColor = computed(() => {
  if (pct.value > 60) return 'bg-emerald-500'
  if (pct.value > 30) return 'bg-amber-500'
  return 'bg-rose-500'
})
</script>

<template>
  <div class="flex items-center gap-2 w-full">
    <span :class="['text-rose-500', sizeClasses.heart]">❤</span>
    <span :class="['font-bold tabular-nums', sizeClasses.num]">{{ lives }}</span>
    <div class="flex-1 rounded-full bg-[var(--color-surface-2)] overflow-hidden" :class="sizeClasses.bar">
      <div
        class="h-full transition-[width] duration-300 ease-out"
        :class="barColor"
        :style="{ width: pct + '%' }"
      />
    </div>
  </div>
</template>
