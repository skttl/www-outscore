<script setup lang="ts">
import type { Player } from '~/stores/game'

defineProps<{
  player: Player
  startLives: number
  active?: boolean
  rank?: number
}>()
</script>

<template>
  <div
    :class="[
      'flex items-center gap-3 px-3 py-2 rounded-lg border transition',
      player.eliminated
        ? 'opacity-40 grayscale border-[var(--color-border)] bg-[var(--color-surface)]'
        : active
          ? 'border-[var(--color-accent)] bg-[var(--color-surface-2)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)]',
    ]"
  >
    <span v-if="rank !== undefined" class="text-xs text-[var(--color-muted)] w-5 text-center tabular-nums">
      {{ rank }}
    </span>
    <span class="text-base">{{ player.isBot ? '🤖' : '👤' }}</span>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 min-w-0">
        <span class="font-semibold truncate">{{ player.name }}</span>
        <span v-if="player.eliminated" class="text-xs text-rose-500">❌</span>
      </div>
      <LivesDisplay :lives="player.lives" :start-lives="startLives" size="sm" />
    </div>
    <span class="text-xs text-[var(--color-muted)] tabular-nums">{{ player.seedScore }}</span>
  </div>
</template>
