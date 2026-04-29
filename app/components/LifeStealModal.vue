<script setup lang="ts">
import type { Player } from '~/stores/game'

const props = defineProps<{
  open: boolean
  thiefName: string
  victims: Player[]
  startLives: number
}>()

const emit = defineEmits<{
  (e: 'pick', id: string): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
    </Transition>
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="open"
        class="fixed inset-x-0 bottom-0 z-50 bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] p-4 pb-8 max-h-[80vh] overflow-y-auto"
      >
        <div class="w-12 h-1.5 bg-[var(--color-border)] rounded-full mx-auto mb-4" />
        <h2 class="text-lg font-bold mb-1">
          🗡️ {{ thiefName }} stjæler et liv
        </h2>
        <p class="text-sm text-[var(--color-muted)] mb-4">
          {{ $t('game.stealTitle') }}
        </p>
        <div class="flex flex-col gap-2">
          <button
            v-for="v in victims"
            :key="v.id"
            type="button"
            class="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] active:scale-[0.98] transition"
            @click="emit('pick', v.id)"
          >
            <span class="text-xl">{{ v.isBot ? '🤖' : '👤' }}</span>
            <div class="flex-1 min-w-0 text-left">
              <div class="font-semibold truncate">{{ v.name }}</div>
              <LivesDisplay :lives="v.lives" :start-lives="startLives" size="sm" />
            </div>
            <span class="text-rose-500 text-2xl">−1</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
