export const BOT_NAMES: string[] = [
  'Phil Taylor',
  'Michael van Gerwen',
  'Luke Littler',
  'Gerwyn Price',
  'Peter Wright',
  'Rob Cross',
  'Michael Smith',
  'Nathan Aspinall',
  'Luke Humphries',
  'Jonny Clayton',
  'James Wade',
  'Eric Bristow',
  'Raymond van Barneveld',
  'Adrian Lewis',
  'Gary Anderson',
  'Stephen Bunting',
  'Dave Chisnall',
  'Dimitri Van den Bergh',
  'Joe Cullen',
  'Damon Heta',
]

export function pickAvailableBotName(usedNames: string[]): string {
  const used = new Set(usedNames.map(n => n.toLowerCase()))
  for (const n of BOT_NAMES) {
    if (!used.has(n.toLowerCase())) return n
  }
  // All taken - generate a numbered fallback
  let i = 1
  while (used.has(`bot ${i}`)) i++
  return `Bot ${i}`
}
