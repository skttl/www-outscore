export type BotDifficulty = 'novice' | 'casual' | 'club' | 'expert' | 'pro'

export const BOT_DIFFICULTIES: BotDifficulty[] = [
  'novice',
  'casual',
  'club',
  'expert',
  'pro',
]

export const BOT_AVG_3DART: Record<BotDifficulty, number> = {
  novice: 20,
  casual: 40,
  club: 60,
  expert: 80,
  pro: 100,
}

interface Bucket {
  // Probability mass
  p: number
  // Sampler returning a single-dart score (0 = miss board)
  sample: () => number
  // Whether the result counts as "hit board" (score>0 always counts as hit; 0 = miss)
  isMiss?: boolean
}

function rand(min: number, max: number): number {
  // inclusive integer
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

const HIGH_DOUBLES = [16, 17, 18, 19, 20].map(n => n * 2) // 32,34,36,38,40
const ALL_DOUBLES = Array.from({ length: 20 }, (_, i) => (i + 1) * 2)
const HIGH_TRIPLES = [17, 18, 19, 20].map(n => n * 3) // 51,54,57,60
const ALL_TRIPLES = Array.from({ length: 20 }, (_, i) => (i + 1) * 3)

const BUCKETS: Record<BotDifficulty, Bucket[]> = {
  novice: [
    { p: 0.20, sample: () => 0, isMiss: true },
    { p: 0.50, sample: () => rand(1, 10) },
    { p: 0.20, sample: () => rand(11, 20) },
    { p: 0.07, sample: () => pickFrom(ALL_DOUBLES) },
    { p: 0.03, sample: () => pickFrom(ALL_TRIPLES) },
  ],
  casual: [
    { p: 0.10, sample: () => 0, isMiss: true },
    { p: 0.30, sample: () => rand(1, 10) },
    { p: 0.35, sample: () => rand(11, 20) },
    { p: 0.05, sample: () => 25 },
    { p: 0.15, sample: () => pickFrom(ALL_DOUBLES) },
    { p: 0.05, sample: () => pickFrom(ALL_TRIPLES) },
  ],
  club: [
    { p: 0.05, sample: () => 0, isMiss: true },
    { p: 0.15, sample: () => rand(1, 10) },
    { p: 0.35, sample: () => rand(15, 20) },
    { p: 0.05, sample: () => 25 },
    { p: 0.20, sample: () => pickFrom(HIGH_DOUBLES) },
    { p: 0.20, sample: () => pickFrom(HIGH_TRIPLES) },
  ],
  expert: [
    { p: 0.02, sample: () => 0, isMiss: true },
    { p: 0.10, sample: () => rand(1, 10) },
    { p: 0.30, sample: () => rand(15, 20) },
    { p: 0.05, sample: () => 25 },
    { p: 0.03, sample: () => 50 },
    { p: 0.20, sample: () => pickFrom(HIGH_DOUBLES) },
    { p: 0.30, sample: () => pickFrom(HIGH_TRIPLES) },
  ],
  pro: [
    { p: 0.01, sample: () => 0, isMiss: true },
    { p: 0.05, sample: () => rand(1, 10) },
    { p: 0.20, sample: () => rand(15, 20) },
    { p: 0.03, sample: () => 25 },
    { p: 0.04, sample: () => 50 },
    { p: 0.17, sample: () => pickFrom(HIGH_DOUBLES) },
    { p: 0.50, sample: () => (Math.random() < 0.6 ? 60 : pickFrom(HIGH_TRIPLES)) },
  ],
}

export interface DartOutcome {
  score: number
  missed: boolean
}

export function simulateDart(difficulty: BotDifficulty): DartOutcome {
  const buckets = BUCKETS[difficulty]
  let r = Math.random()
  for (const b of buckets) {
    if (r < b.p) {
      const score = b.sample()
      return { score, missed: !!b.isMiss }
    }
    r -= b.p
  }
  // Fallback (in case probabilities don't sum to exactly 1)
  const last = buckets[buckets.length - 1]!
  const score = last.sample()
  return { score, missed: !!last.isMiss }
}

export function simulateSeedScore(difficulty: BotDifficulty): number {
  // Seed: throw 2 darts, both must hit. Re-roll until both hit.
  for (let attempt = 0; attempt < 100; attempt++) {
    const a = simulateDart(difficulty)
    const b = simulateDart(difficulty)
    if (!a.missed && !b.missed && a.score > 0 && b.score > 0) {
      return a.score + b.score
    }
  }
  // Hard fallback: pick a sensible value
  return 41
}
