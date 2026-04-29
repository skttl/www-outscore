<script setup lang="ts">
import { useGameStore } from '~/stores/game'
import { validNDartScore } from '~/composables/useScoreValidation'
import { simulateDart } from '~/composables/useBot'
import { feedback, requestWakeLock, releaseWakeLock, setupWakeLockReacquire } from '~/composables/useFeedback'
import { useToasts } from '~/composables/useToast'

const game = useGameStore()
const router = useRouter()
const { t } = useI18n()
const { push: toast } = useToasts()

// Guard: if no game in progress, send to home
onMounted(() => {
  if (game.phase === 'setup' || game.players.length === 0) {
    router.replace('/')
    return
  }
  requestWakeLock()
  setupWakeLockReacquire(() => game.phase === 'playing')
})

onUnmounted(() => {
  releaseWakeLock()
})

// --- Score input state ---
const scoreInput = ref('0')
const dartsMissed = ref(0)

const dartsAvailable = computed(() => game.dartsForUpcomingTurn())
const hitDarts = computed(() => Math.max(0, dartsAvailable.value - dartsMissed.value))
const maxScore = computed(() => hitDarts.value * 60)

const scoreNum = computed(() => parseInt(scoreInput.value, 10) || 0)
const scoreValid = computed(() => validNDartScore(scoreNum.value, hitDarts.value))

function resetInput() {
  scoreInput.value = '0'
  dartsMissed.value = 0
}

function addMissedDart() {
  if (dartsMissed.value < dartsAvailable.value) {
    dartsMissed.value++
    feedback.click()
    // Snap score down if invalid for new hit count
    if (scoreNum.value > maxScore.value) scoreInput.value = String(maxScore.value)
  }
}
function removeMissedDart() {
  if (dartsMissed.value > 0) dartsMissed.value--
}

// --- Steal modal ---
const pendingSteal = ref<{ score: number; missed: number; victims: string[] } | null>(null)
const stealVictims = computed(() =>
  pendingSteal.value
    ? pendingSteal.value.victims
        .map(id => game.getPlayer(id))
        .filter((p): p is NonNullable<ReturnType<typeof game.getPlayer>> => !!p)
    : [],
)

function commitWithSteal(victimId: string) {
  if (!pendingSteal.value) return
  const { score, missed } = pendingSteal.value
  pendingSteal.value = null
  applyTurn(score, missed, victimId)
}

function applyTurn(score: number, missed: number, stealVictimId?: string | null) {
  const player = game.currentPlayer
  if (!player) return
  const playerName = player.name
  const target = game.currentTarget

  const result = game.submitTurn({
    score,
    dartsMissed: missed,
    stealVictimId: stealVictimId ?? null,
  })

  if (!result.committed) {
    pendingSteal.value = { score, missed, victims: result.eligibleVictims }
    return
  }

  // Effects feedback (read latest turn from store)
  const turn = game.turns[game.turns.length - 1]
  if (turn) {
    if (turn.refilled) {
      feedback.refill()
      toast(t('game.refilled', { name: playerName }), 'success', 2600)
    }
    if (turn.lostLife) {
      feedback.lostLife()
      toast(t('game.lostLife', { name: playerName }) + ` (${score} < ${target})`, 'danger')
    }
    if (turn.stoleLifeFromId) {
      const victim = game.getPlayer(turn.stoleLifeFromId)
      feedback.steal()
      toast(t('game.stoleLife', { name: playerName, victim: victim?.name ?? '?' }), 'warning', 2600)
    }
    if (turn.stealSkipped) {
      feedback.click()
      toast(t('game.stealNoTargets'), 'warning', 3000)
    }
    if (turn.eliminatedSelf) {
      feedback.eliminated()
      toast(t('game.eliminated', { name: playerName }), 'danger', 3000)
    }
    if (turn.dartsMissed > 0 && game.phase === 'playing') {
      toast(t('game.missAnnounce', { n: turn.dartsMissed }), 'info', 1800)
    }
  }

  if (game.phase === 'finished') {
    feedback.win()
  }

  resetInput()
}

function submitHumanTurn() {
  if (!scoreValid.value) {
    toast('Ugyldig score for ' + hitDarts.value + ' pile', 'danger')
    return
  }
  applyTurn(scoreNum.value, dartsMissed.value)
}

function undo() {
  if (!game.canUndo) return
  game.undo()
  pendingSteal.value = null
  resetInput()
  feedback.click()
}

// --- Bot turn handling ---
const botThrowing = ref(false)
const botDartsRolled = ref<number[]>([])
const botMissCount = ref(0)
const botRunningTotal = ref(0)

watch(
  () => game.currentPlayer?.id,
  () => {
    maybeRunBotTurn()
  },
  { immediate: true },
)

watch(
  () => game.phase,
  () => {
    maybeRunBotTurn()
  },
)

async function maybeRunBotTurn() {
  if (game.phase !== 'playing') return
  if (botThrowing.value) return
  const player = game.currentPlayer
  if (!player || !player.isBot) return
  if (pendingSteal.value) return

  botThrowing.value = true
  botDartsRolled.value = []
  botMissCount.value = 0
  botRunningTotal.value = 0

  await sleep(600)

  const total = game.dartsForUpcomingTurn()
  for (let i = 0; i < total; i++) {
    const o = simulateDart(player.botDifficulty || 'casual')
    botDartsRolled.value = [...botDartsRolled.value, o.score]
    if (o.missed || o.score === 0) {
      botMissCount.value++
    } else {
      botRunningTotal.value += o.score
    }
    await sleep(450)
  }

  await sleep(700)

  // For bot stealing: pick victim automatically
  let stealVictimId: string | null = null
  if (botRunningTotal.value >= 100) {
    stealVictimId = game.pickStealVictimForBot(player.id)
  }

  applyTurn(botRunningTotal.value, botMissCount.value, stealVictimId)

  botThrowing.value = false
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

const finished = computed(() => game.phase === 'finished')

function newGame() {
  game.reset()
  router.push('/setup')
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <header class="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] flex-shrink-0">
      <button
        type="button"
        class="text-xs text-[var(--color-muted)] active:scale-95 px-2 py-1"
        @click="goHome"
      >
        ← Home
      </button>
      <h1 class="font-bold text-sm">🎯 {{ t('app.title') }}</h1>
      <button
        type="button"
        :disabled="!game.canUndo || botThrowing"
        :class="[
          'text-xs px-3 py-1 rounded-full border transition active:scale-95',
          game.canUndo && !botThrowing
            ? 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]'
            : 'border-[var(--color-border)] text-[var(--color-muted)] opacity-50',
        ]"
        @click="undo"
      >
        ↶ {{ t('game.undo') }}
      </button>
    </header>

    <!-- WINNER SCREEN -->
    <div
      v-if="finished"
      class="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <div class="text-6xl">🏆</div>
      <div>
        <div class="text-sm text-[var(--color-muted)] uppercase tracking-wide">
          {{ t('game.winner') }}
        </div>
        <div class="text-4xl font-black">{{ game.winner?.name }}</div>
      </div>

      <div class="w-full max-w-sm flex flex-col gap-2">
        <div
          v-for="(p, i) in game.orderedPlayers"
          :key="p.id"
          class="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
        >
          <span class="w-5 text-center text-xs text-[var(--color-muted)]">{{ i + 1 }}</span>
          <span>{{ p.isBot ? '🤖' : '👤' }}</span>
          <span class="flex-1 text-left truncate">{{ p.name }}</span>
          <span :class="p.eliminated ? 'text-rose-400 text-xs' : 'text-emerald-400 text-xs'">
            {{ p.eliminated ? '❌' : `❤ ${p.lives}` }}
          </span>
        </div>
      </div>

      <div class="flex flex-col gap-2 w-full max-w-xs">
        <button
          type="button"
          class="h-12 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold active:scale-95"
          @click="newGame"
        >
          {{ t('game.newGame') }}
        </button>
        <button
          v-if="game.canUndo"
          type="button"
          class="h-10 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm active:scale-95"
          @click="undo"
        >
          ↶ {{ t('game.undo') }}
        </button>
      </div>
    </div>

    <!-- ACTIVE GAME -->
    <template v-else>
      <!-- Active player card -->
      <section
        v-if="game.currentPlayer"
        class="px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0"
        :class="[botThrowing ? 'bg-amber-500/5' : '']"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="text-2xl">{{ game.currentPlayer.isBot ? '🤖' : '👤' }}</span>
          <div class="flex-1 min-w-0">
            <div class="text-xs text-[var(--color-muted)] uppercase tracking-wide">
              {{ botThrowing ? t('game.botThrowing', { name: game.currentPlayer.name }) : t('game.yourTurn') }}
            </div>
            <div class="text-2xl font-black truncate">{{ game.currentPlayer.name }}</div>
          </div>
          <div class="text-right">
            <div class="text-[10px] text-[var(--color-muted)] uppercase">{{ t('game.target') }}</div>
            <div class="text-2xl font-bold tabular-nums text-[var(--color-accent)]">
              {{ game.currentTarget }}
            </div>
          </div>
        </div>
        <LivesDisplay
          :lives="game.currentPlayer.lives"
          :start-lives="game.state.startLives"
          size="md"
        />
        <div class="flex items-center justify-between mt-2 text-xs text-[var(--color-muted)]">
          <span>
            {{ t('game.darts') }}: <strong class="text-[var(--color-text)]">{{ dartsAvailable }}</strong>
            <span v-if="game.pendingExtraDarts > 0" class="text-amber-400">
              (+{{ game.pendingExtraDarts }} {{ t('game.extra') }})
            </span>
          </span>
          <span v-if="dartsMissed > 0" class="text-amber-400">
            {{ dartsMissed }} ✗
          </span>
        </div>
      </section>

      <!-- Players ranking (compact) -->
      <section class="flex-shrink-0 overflow-y-auto px-2 py-1.5 border-b border-[var(--color-border)]">
        <div class="flex flex-col gap-1">
          <PlayerListRow
            v-for="(p, i) in game.orderedPlayers"
            :key="p.id"
            :player="p"
            :start-lives="game.state.startLives"
            :rank="i + 1"
            :active="game.currentPlayer?.id === p.id"
          />
        </div>
      </section>

      <!-- Bot animation panel -->
      <section
        v-if="botThrowing"
        class="flex-1 flex flex-col items-center justify-center gap-4 px-6"
      >
        <div class="text-7xl animate-pulse">🎯</div>
        <div class="text-2xl font-bold">{{ botRunningTotal }}</div>
        <div class="flex gap-2 text-sm text-[var(--color-muted)]">
          <span
            v-for="(s, i) in botDartsRolled"
            :key="i"
            :class="[
              'px-3 py-1 rounded-full border',
              s === 0
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                : 'border-[var(--color-border)] bg-[var(--color-surface)]',
            ]"
          >
            {{ s === 0 ? '✗' : s }}
          </span>
          <span
            v-for="i in (game.dartsForUpcomingTurn() - botDartsRolled.length)"
            :key="`p-${i}`"
            class="px-3 py-1 rounded-full border border-dashed border-[var(--color-border)] text-[var(--color-muted)]"
          >
            ?
          </span>
        </div>
      </section>

      <!-- Score input + numpad (only for human turn) -->
      <section
        v-else
        class="flex-1 flex flex-col justify-end px-3 pb-1 pt-2 gap-2 min-h-0"
      >
        <!-- Score display -->
        <div class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <button
            type="button"
            :disabled="dartsMissed === 0"
            class="text-xs px-2 py-1 rounded-md bg-[var(--color-surface-2)] disabled:opacity-30 active:scale-95"
            @click="removeMissedDart"
          >
            −✗
          </button>
          <div class="flex-1 text-center">
            <div class="text-4xl font-black tabular-nums leading-none">{{ scoreInput }}</div>
            <div class="text-[10px] text-[var(--color-muted)] mt-0.5">
              max {{ maxScore }}
              <span v-if="!scoreValid && scoreNum > 0" class="text-rose-400 ml-1">⚠ ugyldig</span>
            </div>
          </div>
          <button
            type="button"
            :disabled="dartsMissed >= dartsAvailable"
            :class="[
              'text-xs px-2 py-1 rounded-md active:scale-95',
              dartsMissed >= dartsAvailable
                ? 'bg-[var(--color-surface-2)] opacity-30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
            ]"
            @click="addMissedDart"
          >
            +✗ {{ t('game.missedDart') }}
          </button>
        </div>

        <NumPad
          v-model:value="scoreInput"
          :max-score="maxScore"
          :disabled="!game.currentPlayer || botThrowing"
          :ok-label="t('game.ok')"
          @submit="submitHumanTurn"
        />
      </section>
    </template>

    <LifeStealModal
      :open="!!pendingSteal"
      :thief-name="game.currentPlayer?.name ?? ''"
      :victims="stealVictims"
      :start-lives="game.state.startLives"
      @pick="commitWithSteal"
    />
    <ToastStack />
  </div>
</template>
