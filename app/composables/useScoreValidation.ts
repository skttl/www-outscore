/**
 * Score validation for dart throws.
 * A single dart can score one of these values (S = single, D = double, T = triple):
 *   0 (miss board) - excluded when validating "must hit board"
 *   1..20 (S1..S20)
 *   25 (single bull), 50 (bullseye)
 *   2..40 even (D1..D20)
 *   3..60 multiples of 3 (T1..T20)
 */

const SINGLE_DART_HITS: Set<number> = (() => {
  const s = new Set<number>()
  for (let i = 1; i <= 20; i++) {
    s.add(i)
    s.add(i * 2)
    s.add(i * 3)
  }
  s.add(25)
  s.add(50)
  return s
})()

export const SINGLE_DART_VALUES_HIT: number[] = Array.from(SINGLE_DART_HITS).sort(
  (a, b) => a - b,
)

// reachable[n] = set of all sums achievable with exactly n darts that all hit the board
const reachableCache = new Map<number, Set<number>>()
reachableCache.set(0, new Set<number>([0]))
reachableCache.set(1, new Set<number>(SINGLE_DART_VALUES_HIT))

function reachable(n: number): Set<number> {
  if (n < 0) return new Set()
  const cached = reachableCache.get(n)
  if (cached) return cached
  const prev = reachable(n - 1)
  const out = new Set<number>()
  for (const a of prev) {
    for (const b of SINGLE_DART_VALUES_HIT) {
      out.add(a + b)
    }
  }
  reachableCache.set(n, out)
  return out
}

// Pre-warm up to 6 darts (cheap)
for (let i = 2; i <= 6; i++) reachable(i)

export function valid2DartScore(score: number): boolean {
  if (!Number.isInteger(score)) return false
  if (score < 2 || score > 120) return false
  return reachable(2).has(score)
}

export function validNDartScore(score: number, hitDarts: number): boolean {
  if (!Number.isInteger(score) || score < 0) return false
  if (hitDarts < 0) return false
  if (hitDarts === 0) return score === 0
  if (score > hitDarts * 60) return false
  return reachable(hitDarts).has(score)
}

export function maxScoreForDarts(n: number): number {
  return n * 60
}
