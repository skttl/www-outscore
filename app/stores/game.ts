import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { simulateSeedScore, type BotDifficulty } from '~/composables/useBot'
import { valid2DartScore } from '~/composables/useScoreValidation'

export type Phase = 'setup' | 'playing' | 'finished'

export interface Player {
  id: string
  name: string
  seedScore: number
  lives: number
  eliminated: boolean
  isBot: boolean
  botDifficulty?: BotDifficulty
}

export interface Turn {
  playerId: string
  score: number
  dartsThrown: number
  dartsMissed: number
  targetAtTurn: number
  extraDartsAtStart: number
  lostLife: boolean
  stoleLifeFromId?: string
  stealSkipped: boolean
  refilled: boolean
  eliminatedSelf: boolean
}

export interface GameState {
  phase: Phase
  startLives: number
  players: Player[]
  order: string[]
  currentIndex: number
  currentTarget: number
  pendingExtraDarts: number
  turns: Turn[]
  createdAt: number
  version: 1
}

const STORAGE_KEY = 'stregespil-game-v1'

function makeInitialState(): GameState {
  return {
    phase: 'setup',
    startLives: 11,
    players: [],
    order: [],
    currentIndex: 0,
    currentTarget: 0,
    pendingExtraDarts: 0,
    turns: [],
    createdAt: Date.now(),
    version: 1,
  }
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export const useGameStore = defineStore('game', () => {
  const state = useStorage<GameState>(STORAGE_KEY, makeInitialState(), undefined, {
    mergeDefaults: true,
  })

  // ------------------------------------------------------------------
  // Getters
  // ------------------------------------------------------------------
  const phase = computed(() => state.value.phase)
  const players = computed(() => state.value.players)
  const order = computed(() => state.value.order)
  const orderedPlayers = computed(() =>
    state.value.order
      .map(id => state.value.players.find(p => p.id === id))
      .filter((p): p is Player => !!p),
  )
  const currentPlayer = computed<Player | null>(() => {
    if (state.value.phase !== 'playing') return null
    const id = state.value.order[state.value.currentIndex]
    if (!id) return null
    return state.value.players.find(p => p.id === id) ?? null
  })
  const currentTarget = computed(() => state.value.currentTarget)
  const pendingExtraDarts = computed(() => state.value.pendingExtraDarts)
  const turns = computed(() => state.value.turns)
  const canUndo = computed(() => state.value.turns.length > 0)
  const livingPlayers = computed(() => state.value.players.filter(p => !p.eliminated))
  const winner = computed<Player | null>(() => {
    if (state.value.phase !== 'finished') return null
    return livingPlayers.value[0] ?? null
  })

  function getPlayer(id: string): Player | null {
    return state.value.players.find(p => p.id === id) ?? null
  }

  function dartsForUpcomingTurn(): number {
    return 3 + state.value.pendingExtraDarts
  }

  // ------------------------------------------------------------------
  // Setup actions
  // ------------------------------------------------------------------
  function reset() {
    state.value = makeInitialState()
  }

  function setStartLives(n: number) {
    if (state.value.phase !== 'setup') return
    state.value.startLives = Math.max(1, Math.min(99, Math.floor(n)))
  }

  function isSeedScoreTaken(score: number, exceptId?: string): boolean {
    return state.value.players.some(p => p.seedScore === score && p.id !== exceptId)
  }

  function addHumanPlayer(name: string, seedScore: number): Player | null {
    if (state.value.phase !== 'setup') return null
    const trimmed = name.trim()
    if (!trimmed) return null
    if (isSeedScoreTaken(seedScore)) return null
    const player: Player = {
      id: uid(),
      name: trimmed,
      seedScore,
      lives: state.value.startLives,
      eliminated: false,
      isBot: false,
    }
    state.value.players.push(player)
    return player
  }

  function addBotPlayer(name: string, difficulty: BotDifficulty): Player {
    const player: Player = {
      id: uid(),
      name: name.trim() || 'Bot',
      seedScore: 0, // assigned at start
      lives: state.value.startLives,
      eliminated: false,
      isBot: true,
      botDifficulty: difficulty,
    }
    state.value.players.push(player)
    return player
  }

  function removePlayer(id: string) {
    if (state.value.phase !== 'setup') return
    state.value.players = state.value.players.filter(p => p.id !== id)
  }

  function startGame() {
    if (state.value.phase !== 'setup') return
    if (state.value.players.length < 3) return

    // Assign seedScores to bots
    const taken = new Set<number>(
      state.value.players.filter(p => !p.isBot).map(p => p.seedScore),
    )
    for (const p of state.value.players) {
      if (!p.isBot) continue
      let score = 0
      for (let attempt = 0; attempt < 100; attempt++) {
        const candidate = simulateSeedScore(p.botDifficulty || 'casual')
        if (!taken.has(candidate)) {
          score = candidate
          break
        }
      }
      if (score === 0) {
        // Fallback: pick smallest unused valid 2-dart score
        for (let s = 2; s <= 120; s++) {
          if (!taken.has(s) && valid2DartScore(s)) {
            score = s
            break
          }
        }
      }
      p.seedScore = score
      taken.add(score)
    }

    // Sync lives to startLives
    for (const p of state.value.players) {
      p.lives = state.value.startLives
      p.eliminated = false
    }

    // Sort by seedScore desc -> order
    state.value.order = [...state.value.players]
      .sort((a, b) => b.seedScore - a.seedScore)
      .map(p => p.id)
    state.value.currentIndex = 0
    state.value.currentTarget = 0
    state.value.pendingExtraDarts = 0
    state.value.turns = []
    state.value.phase = 'playing'
    state.value.createdAt = Date.now()
  }

  // ------------------------------------------------------------------
  // Turn submission
  // ------------------------------------------------------------------
  interface SubmitTurnInput {
    score: number
    dartsMissed: number
    stealVictimId?: string | null // required when steal possible; ignored otherwise
  }

  /**
   * Returns "needsSteal": list of eligible victim ids if the caller must pick one.
   * Returns null if turn was committed.
   */
  function submitTurn(input: SubmitTurnInput): { committed: true } | { committed: false; eligibleVictims: string[] } {
    if (state.value.phase !== 'playing') return { committed: true }
    const player = currentPlayer.value
    if (!player) return { committed: true }

    const dartsThrown = dartsForUpcomingTurn()
    const dartsMissed = Math.max(0, Math.min(dartsThrown, Math.floor(input.dartsMissed)))
    const score = Math.max(0, Math.floor(input.score))
    const target = state.value.currentTarget
    const extraDartsAtStart = state.value.pendingExtraDarts

    const willSteal = score >= 100
    const eligibleVictims = willSteal
      ? state.value.players.filter(p => p.id !== player.id && !p.eliminated && p.lives > 1).map(p => p.id)
      : []

    if (willSteal && eligibleVictims.length > 0 && !input.stealVictimId) {
      return { committed: false, eligibleVictims }
    }

    const turn: Turn = {
      playerId: player.id,
      score,
      dartsThrown,
      dartsMissed,
      targetAtTurn: target,
      extraDartsAtStart,
      lostLife: false,
      stealSkipped: false,
      refilled: false,
      eliminatedSelf: false,
    }

    // Apply effects
    if (score < target) {
      player.lives -= 1
      turn.lostLife = true
    }

    if (score >= 180) {
      player.lives = state.value.startLives
      turn.refilled = true
    }

    if (willSteal) {
      if (eligibleVictims.length > 0 && input.stealVictimId && eligibleVictims.includes(input.stealVictimId)) {
        const victim = state.value.players.find(p => p.id === input.stealVictimId)
        if (victim) {
          victim.lives -= 1
          turn.stoleLifeFromId = victim.id
        }
      } else {
        turn.stealSkipped = true
      }
    }

    state.value.currentTarget = score

    if (player.lives <= 0) {
      player.eliminated = true
      player.lives = 0
      turn.eliminatedSelf = true
    }

    state.value.turns.push(turn)
    state.value.pendingExtraDarts = dartsMissed

    // Check winner
    const livingCount = state.value.players.filter(p => !p.eliminated).length
    if (livingCount <= 1) {
      state.value.phase = 'finished'
      return { committed: true }
    }

    advanceCurrentIndex()
    return { committed: true }
  }

  function advanceCurrentIndex() {
    const total = state.value.order.length
    for (let i = 1; i <= total; i++) {
      const idx = (state.value.currentIndex + i) % total
      const id = state.value.order[idx]
      if (!id) continue
      const p = state.value.players.find(pl => pl.id === id)
      if (p && !p.eliminated) {
        state.value.currentIndex = idx
        return
      }
    }
  }

  // ------------------------------------------------------------------
  // Undo
  // ------------------------------------------------------------------
  function undo() {
    if (state.value.turns.length === 0) return
    state.value.turns.pop()
    recompute()
  }

  function recompute() {
    // Reset all players to initial state
    for (const p of state.value.players) {
      p.lives = state.value.startLives
      p.eliminated = false
    }
    state.value.currentTarget = 0
    state.value.pendingExtraDarts = 0
    state.value.currentIndex = 0
    state.value.phase = 'playing'

    // Replay each turn
    for (const turn of state.value.turns) {
      const player = state.value.players.find(p => p.id === turn.playerId)
      if (!player) continue

      if (turn.score < turn.targetAtTurn) {
        player.lives -= 1
      }
      if (turn.score >= 180) {
        player.lives = state.value.startLives
      }
      if (turn.stoleLifeFromId) {
        const victim = state.value.players.find(p => p.id === turn.stoleLifeFromId)
        if (victim) victim.lives -= 1
      }
      if (player.lives <= 0) {
        player.eliminated = true
        player.lives = 0
      }
      // Victims also: check elimination (shouldn't happen because rule prevents stealing last life, but defensively)
      for (const p of state.value.players) {
        if (p.lives <= 0 && !p.eliminated) {
          p.eliminated = true
          p.lives = 0
        }
      }

      state.value.currentTarget = turn.score
      state.value.pendingExtraDarts = turn.dartsMissed

      // advance
      const total = state.value.order.length
      for (let i = 1; i <= total; i++) {
        const idx = (state.value.currentIndex + i) % total
        const id = state.value.order[idx]
        if (!id) continue
        const p = state.value.players.find(pl => pl.id === id)
        if (p && !p.eliminated) {
          state.value.currentIndex = idx
          break
        }
      }
    }

    // After replay, check if we should be in finished phase
    const livingCount = state.value.players.filter(p => !p.eliminated).length
    if (state.value.turns.length > 0 && livingCount <= 1) {
      state.value.phase = 'finished'
    } else {
      state.value.phase = 'playing'
    }

    // If no turns, currentIndex should be 0
    if (state.value.turns.length === 0) {
      state.value.currentIndex = 0
      state.value.currentTarget = 0
      state.value.pendingExtraDarts = 0
    }
  }

  // ------------------------------------------------------------------
  // Bot helpers
  // ------------------------------------------------------------------
  function pickStealVictimForBot(botId: string): string | null {
    // Largest threat = highest seedScore among living non-self with lives>1
    const candidates = state.value.players
      .filter(p => p.id !== botId && !p.eliminated && p.lives > 1)
      .sort((a, b) => {
        if (b.seedScore !== a.seedScore) return b.seedScore - a.seedScore
        if (b.lives !== a.lives) return b.lives - a.lives
        return a.id.localeCompare(b.id)
      })
    return candidates[0]?.id ?? null
  }

  return {
    // state
    state,
    // getters
    phase,
    players,
    order,
    orderedPlayers,
    currentPlayer,
    currentTarget,
    pendingExtraDarts,
    turns,
    canUndo,
    livingPlayers,
    winner,
    // queries
    getPlayer,
    dartsForUpcomingTurn,
    isSeedScoreTaken,
    pickStealVictimForBot,
    // actions
    reset,
    setStartLives,
    addHumanPlayer,
    addBotPlayer,
    removePlayer,
    startGame,
    submitTurn,
    undo,
  }
})
