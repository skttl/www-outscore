<script setup lang="ts">
import type { Player } from '~/stores/game'

const props = defineProps<{
  player: Player
  startLives: number
  active?: boolean
  rank?: number
}>()

const pct = computed(() =>
  Math.max(0, Math.min(100, (props.player.lives / Math.max(1, props.startLives)) * 100)),
)
const barColor = computed(() => {
  if (pct.value > 60) return 'bg-emerald-500'
  if (pct.value > 30) return 'bg-amber-500'
  return 'bg-rose-500'
})
</script>

<template>
  <div
    :class="[
      'flex items-center gap-2 px-2 py-1 rounded-md border text-sm transition',
      player.eliminated
        ? 'opacity-40 grayscale border-[var(--color-border)] bg-[var(--color-surface)]'
        : active
          ? 'border-[var(--color-accent)] bg-[var(--color-surface-2)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)]',
    ]"
  >
    <span
      v-if="rank !== undefined"
      class="w-4 text-[10px] tabular-nums text-[var(--color-muted)] text-center"
    >
      {{ rank }}
    </span>
    <span class="text-sm leading-none">{{ player.isBot ? '🤖' : '👤' }}</span>
    <span class="flex-1 min-w-0 truncate font-medium">
      {{ player.name }}
      <span v-if="player.eliminated" class="text-rose-500">❌</span>
    </span>
    <!-- inline lives bar -->
    <div class="w-16 h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
      <div
        class="h-full transition-[width] duration-300"
        :class="barColor"
        :style="{ width: pct + '%' }"
      />
    </div>
    <span class="w-6 text-right tabular-nums text-xs font-bold">
      <span class="text-rose-500">❤</span>{{ player.lives }}
    </span>
  </div>
</template>
