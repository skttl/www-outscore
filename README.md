# Stregespil

Touch-venlig scoreboard-app til dart-varianten "stregespil". Bygget med Nuxt 4, Tailwind 4, Pinia og VueUse. Designet til mobil/tablet i portrait mode.

## Regler (kort)

- **3+ deltagere**, hver har 11 liv (konfigurerbart).
- **Seedning**: hver spiller kaster 2 pile - højeste score starter. Bots får tildelt seedscore automatisk.
- **Spil**: 3 pile pr tur. Næste spiller skal ramme min. seneste spillers score, ellers mistes 1 liv. Target opdateres altid til seneste score.
- **≥100**: tag et liv fra en anden spiller (skal stjæle, hvis nogen har >1 liv).
- **180+**: alle liv tilbage + stjæl liv.
- **Pile der missede skiven** går videre til næste spiller (akkumulerer).
- Sidste mand med liv vinder.

## Kør lokalt

```bash
pnpm install
pnpm dev
```

Åbn `http://localhost:3000` i en mobil-browser eller emulator i portrait.

## Build

```bash
pnpm build           # SSR-disabled SPA
pnpm generate        # statisk eksport (output i .output/public)
pnpm preview
```

## Deploy til GitHub Pages

Repo'et indeholder en GitHub Actions workflow (`.github/workflows/deploy.yml`) der ved push til `main`:

1. Kører `pnpm generate` (statisk SPA + service worker)
2. Uploader `.output/public` som Pages-artifact
3. Deployer til GitHub Pages-environment

Custom domain `outscore.skttl.dk` er konfigureret via `public/CNAME`.

### Engangs-opsætning

1. Opret repo på GitHub og push: `git remote add origin <url>` + `git push -u origin main`
2. På GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. På GitHub: **Settings → Pages → Custom domain: `outscore.skttl.dk`** (validér DNS)
4. DNS hos domæne-udbyder (Skttl): `CNAME outscore → <bruger>.github.io`

## Features

- 5 bot-sværhedsgrader (20/40/60/80/100 i 3-pil-snit)
- Pil-for-pil bot-simulering med animation
- Fuld undo (rul tilbage til allerførste kast)
- Auto-gemt i `localStorage` - browser-luk/dvale taber intet
- Wake Lock så telefonen ikke går i dvale midt i spillet
- Lyd + haptisk feedback
- Dansk og engelsk UI

## Projektstruktur

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
