# Outscore

Touch-friendly scoreboard app for the dart variant "Outscore". Built with Nuxt 4, Tailwind 4, Pinia and VueUse. Designed for mobile/tablet in portrait mode.

## Rules (short)

- **3+ players**, each starting with 11 lives (configurable).
- **Seeding**: each player throws 2 darts - highest score starts. Bots are assigned a seed score automatically.
- **Play**: 3 darts per turn. The next player must at least match the previous player's score, otherwise they lose 1 life. The target is always updated to the most recent score.
- **≥100**: take a life from another player (must steal if anyone has >1 life).
- **180+**: all lives restored + steal a life.
- **Darts that missed the board** carry over to the next player (accumulating).
- Last player with lives remaining wins.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` in a mobile browser or emulator in portrait.

## Build

```bash
pnpm build           # SSR-disabled SPA
pnpm generate        # static export (output in .output/public)
pnpm preview
```

## Deploy to GitHub Pages

The repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that on push to `main`:

1. Runs `pnpm generate` (static SPA + service worker)
2. Uploads `.output/public` as a Pages artifact
3. Deploys to the GitHub Pages environment

The custom domain `outscore.skttl.dk` is configured via `public/CNAME`.

### One-time setup

1. Create a repo on GitHub and push: `git remote add origin <url>` + `git push -u origin main`
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. On GitHub: **Settings → Pages → Custom domain: `outscore.skttl.dk`** (validate DNS)
4. DNS at the domain provider (Skttl): `CNAME outscore → <user>.github.io`

## Features

- 5 bot difficulty levels (20/40/60/80/100 average per 3 darts)
- Dart-by-dart bot simulation with animation
- Full undo (roll back to the very first throw)
- Auto-saved in `localStorage` - closing the browser or sleep loses nothing
- Wake Lock so the phone doesn't sleep mid-game
- Sound + haptic feedback
- Danish and English UI

## Project structure

```
app/
├── pages/                 # index, setup, game
├── components/            # NumPad, PlayerListItem, LivesDisplay, LifeStealModal, ToastStack
├── composables/           # useScoreValidation, useBot, useFeedback, useToast
├── stores/                # game.ts (Pinia)
├── assets/data/           # botNames.ts
└── assets/css/            # tailwind.css
i18n/locales/              # da.json, en.json
```
