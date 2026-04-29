<script setup lang="ts">
import { useGameStore } from '~/stores/game'

const game = useGameStore()
const { t, locale, locales, setLocale } = useI18n()
const router = useRouter()

const hasGameInProgress = computed(
  () => game.phase === 'playing' || game.phase === 'finished',
)

function newGame() {
  if (hasGameInProgress.value && !confirm(t('home.newGameConfirm'))) return
  game.reset()
  router.push('/setup')
}

function resume() {
  router.push('/game')
}

function changeLocale(e: Event) {
  const target = e.target as HTMLSelectElement
  setLocale(target.value as any)
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center px-6 gap-8 text-center">
    <select
      :value="locale"
      class="absolute top-3 right-3 text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[var(--color-muted)] bg-[var(--color-surface)] outline-none"
      @change="changeLocale"
    >
      <option v-for="l in locales" :key="(l as any).code" :value="(l as any).code">
        {{ (l as any).name }}
      </option>
    </select>

    <div class="flex flex-col items-center gap-2">
      <div class="text-6xl">🎯</div>
      <h1 class="text-4xl font-black tracking-tight">{{ t('app.title') }}</h1>
      <p class="text-[var(--color-muted)]">{{ t('app.subtitle') }}</p>
    </div>

    <div class="flex flex-col gap-3 w-full max-w-xs">
      <button
        v-if="hasGameInProgress"
        type="button"
        class="h-14 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold text-lg active:scale-95 transition"
        @click="resume"
      >
        {{ t('home.resume') }}
      </button>
      <button
        type="button"
        :class="[
          'h-14 rounded-xl font-bold text-lg active:scale-95 transition',
          hasGameInProgress
            ? 'bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)]'
            : 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]',
        ]"
        @click="newGame"
      >
        {{ t('home.newGame') }}
      </button>
    </div>
  </div>
</template>
