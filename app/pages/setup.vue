<script setup lang="ts">
import { useGameStore } from '~/stores/game'
import { valid2DartScore } from '~/composables/useScoreValidation'
import { BOT_DIFFICULTIES, BOT_AVG_3DART, type BotDifficulty } from '~/composables/useBot'
import { pickAvailableBotName } from '~/assets/data/botNames'

const game = useGameStore()
const router = useRouter()
const { t } = useI18n()

type Tab = 'human' | 'bot'
const tab = ref<Tab>('human')

const humanName = ref('')
const humanScoreText = ref('')

const botName = ref('')
const botDifficulty = ref<BotDifficulty>('casual')

const startLives = computed({
  get: () => game.state.startLives,
  set: (v: number) => game.setStartLives(v),
})

const humanScoreNum = computed(() => {
  const trimmed = humanScoreText.value.trim()
  if (!trimmed) return null
  const n = parseInt(trimmed, 10)
  if (!Number.isInteger(n)) return null
  return n
})

const humanScoreError = computed<string | null>(() => {
  const n = humanScoreNum.value
  if (n === null) return null
  if (n < 2 || n > 120) return t('setup.outOfRange')
  if (!valid2DartScore(n)) return t('setup.invalidScore')
  if (game.isSeedScoreTaken(n)) return t('setup.duplicateScore')
  return null
})

const canAddHuman = computed(
  () =>
    humanName.value.trim().length > 0 &&
    humanScoreNum.value !== null &&
    humanScoreError.value === null,
)

function suggestBotName() {
  if (!botName.value.trim()) {
    botName.value = pickAvailableBotName(game.players.map(p => p.name))
  }
}

watch(
  () => tab.value,
  v => {
    if (v === 'bot') suggestBotName()
  },
)

onMounted(() => {
  if (game.phase !== 'setup') {
    game.reset()
  }
  if (tab.value === 'bot') suggestBotName()
})

function addHuman() {
  if (!canAddHuman.value) return
  game.addHumanPlayer(humanName.value.trim(), humanScoreNum.value!)
  humanName.value = ''
  humanScoreText.value = ''
}

function addBot() {
  const name = botName.value.trim() || pickAvailableBotName(game.players.map(p => p.name))
  game.addBotPlayer(name, botDifficulty.value)
  botName.value = ''
  suggestBotName()
}

function remove(id: string) {
  game.removePlayer(id)
}

const canStart = computed(() => game.players.length >= 3)

function start() {
  if (!canStart.value) return
  game.startGame()
  router.push('/game')
}

function appendDigit(d: string) {
  let next = (humanScoreText.value === '0' || humanScoreText.value === '') ? d : humanScoreText.value + d
  if (next.length > 3) return
  if (parseInt(next, 10) > 120) return
  humanScoreText.value = next
}
function backspaceScore() {
  humanScoreText.value = humanScoreText.value.slice(0, -1)
}
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
      <button
        type="button"
        class="text-sm text-[var(--color-muted)] active:scale-95"
        @click="router.push('/')"
      >
        ← {{ t('app.title') }}
      </button>
      <h1 class="font-bold">{{ t('setup.title') }}</h1>
      <div class="w-12" />
    </header>

    <div class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
      <!-- Start lives -->
      <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <label class="text-sm">{{ t('setup.startLives') }}</label>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="w-9 h-9 rounded-lg bg-[var(--color-surface-2)] active:scale-95"
            @click="startLives = startLives - 1"
          >
            −
          </button>
          <span class="w-10 text-center text-xl font-bold tabular-nums">{{ startLives }}</span>
          <button
            type="button"
            class="w-9 h-9 rounded-lg bg-[var(--color-surface-2)] active:scale-95"
            @click="startLives = startLives + 1"
          >
            +
          </button>
        </div>
      </div>

      <!-- Participants list -->
      <div v-if="game.players.length > 0" class="flex flex-col gap-2">
        <div class="text-xs uppercase tracking-wide text-[var(--color-muted)] px-1">
          {{ t('setup.participants') }} ({{ game.players.length }})
        </div>
        <div class="flex flex-col gap-2">
          <div
            v-for="p in game.players"
            :key="p.id"
            class="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
          >
            <span>{{ p.isBot ? '🤖' : '👤' }}</span>
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{{ p.name }}</div>
              <div class="text-xs text-[var(--color-muted)]">
                <template v-if="p.isBot">
                  {{ t(`setup.difficulties.${p.botDifficulty}`) }}
                  · {{ BOT_AVG_3DART[p.botDifficulty!] }} {{ t('setup.avg') }}
                </template>
                <template v-else>
                  {{ t('setup.seedScore') }}: {{ p.seedScore }}
                </template>
              </div>
            </div>
            <button
              type="button"
              class="text-rose-400 text-sm px-2 py-1 active:scale-95"
              @click="remove(p.id)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--color-surface-2)]">
        <button
          type="button"
          :class="[
            'h-10 rounded-lg text-sm font-semibold transition',
            tab === 'human' ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]' : 'text-[var(--color-muted)]',
          ]"
          @click="tab = 'human'"
        >
          👤 {{ t('setup.addHuman') }}
        </button>
        <button
          type="button"
          :class="[
            'h-10 rounded-lg text-sm font-semibold transition',
            tab === 'bot' ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]' : 'text-[var(--color-muted)]',
          ]"
          @click="tab = 'bot'"
        >
          🤖 {{ t('setup.addBot') }}
        </button>
      </div>

      <!-- Human form -->
      <div v-if="tab === 'human'" class="flex flex-col gap-3">
        <label class="flex flex-col gap-1">
          <span class="text-xs uppercase tracking-wide text-[var(--color-muted)]">{{ t('setup.name') }}</span>
          <input
            v-model="humanName"
            type="text"
            autocomplete="off"
            class="h-12 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-base"
          />
        </label>

        <div class="flex flex-col gap-1">
          <span class="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            {{ t('setup.seedScore') }}
          </span>
          <div class="h-14 px-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between">
            <span class="text-3xl font-bold tabular-nums">{{ humanScoreText || '—' }}</span>
            <span v-if="humanScoreError" class="text-xs text-rose-400">{{ humanScoreError }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 mt-1">
            <button
              v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
              :key="n"
              type="button"
              class="h-12 rounded-lg bg-[var(--color-surface-2)] active:scale-95 text-xl font-semibold"
              @click="appendDigit(String(n))"
            >
              {{ n }}
            </button>
            <button
              type="button"
              class="h-12 rounded-lg bg-[var(--color-surface-2)] active:scale-95"
              @click="humanScoreText = ''"
            >
              C
            </button>
            <button
              type="button"
              class="h-12 rounded-lg bg-[var(--color-surface-2)] active:scale-95 text-xl font-semibold"
              @click="appendDigit('0')"
            >
              0
            </button>
            <button
              type="button"
              class="h-12 rounded-lg bg-[var(--color-surface-2)] active:scale-95 text-lg"
              @click="backspaceScore"
            >
              ⌫
            </button>
          </div>
        </div>

        <button
          type="button"
          :disabled="!canAddHuman"
          :class="[
            'h-12 rounded-xl font-bold transition',
            canAddHuman
              ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)] active:scale-95'
              : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]',
          ]"
          @click="addHuman"
        >
          {{ t('setup.addParticipant') }}
        </button>
      </div>

      <!-- Bot form -->
      <div v-else class="flex flex-col gap-3">
        <label class="flex flex-col gap-1">
          <span class="text-xs uppercase tracking-wide text-[var(--color-muted)]">{{ t('setup.name') }}</span>
          <input
            v-model="botName"
            type="text"
            autocomplete="off"
            class="h-12 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-base"
          />
        </label>
        <div class="flex flex-col gap-2">
          <span class="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            {{ t('setup.difficulty') }}
          </span>
          <div class="grid grid-cols-5 gap-1">
            <button
              v-for="d in BOT_DIFFICULTIES"
              :key="d"
              type="button"
              :class="[
                'h-14 rounded-lg flex flex-col items-center justify-center text-[10px] uppercase tracking-wide transition',
                botDifficulty === d
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]',
              ]"
              @click="botDifficulty = d"
            >
              <span class="font-bold text-sm normal-case">{{ t(`setup.difficulties.${d}`) }}</span>
              <span class="opacity-70">{{ BOT_AVG_3DART[d] }}</span>
            </button>
          </div>
        </div>
        <button
          type="button"
          class="h-12 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold active:scale-95"
          @click="addBot"
        >
          {{ t('setup.addParticipant') }}
        </button>
      </div>
    </div>

    <!-- Sticky footer -->
    <footer class="px-4 pt-3 pb-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <button
        type="button"
        :disabled="!canStart"
        :class="[
          'h-14 w-full rounded-xl text-lg font-bold transition',
          canStart
            ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)] active:scale-95'
            : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]',
        ]"
        @click="start"
      >
        {{ canStart ? t('setup.startGame') : t('setup.minPlayers') }}
      </button>
    </footer>
  </div>
</template>
