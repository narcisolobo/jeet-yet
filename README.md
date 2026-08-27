# Jeet Yet?

A recipe app that makes capturing a recipe — from a website, a photo, or memory — fast and low-friction, then keeps it organized, searchable, and easy to cook from. Open to any user, with recipes public and discoverable by default.

> 🚧 **Early development.** Auth and onboarding are shipped; the core recipe experience is actively being built. See [Roadmap](#roadmap) for what's live versus planned.

## Why

Existing recipe apps are bad at getting recipes _into_ the app — scraping is unreliable, manual entry is tedious, and there's no good path for recipes that live on paper (cookbooks, handwritten cards). Jeet Yet is built around fixing that, then supporting everyday cooking: scaling, unit conversion, and a distraction-free cook mode.

## Features

- **Fast capture** — import from a URL, snap a photo for OCR, or paste a block of text and let it auto-split into ingredients and steps
- **Structured ingredients** — scaling and unit conversion operate on real structured data, not raw strings
- **Organize & find** — categories, tags, and search by name/ingredient/tag (via Algolia)
- **Public by default** — every recipe has its own page and is discoverable; favorite or thumbs-up/down any public recipe
- **Cross-device sync** — backed by Firestore, works the same on web and (later) iOS
- **Cook mode** — step-by-step, screen-awake, built-in timers

## Roadmap

Status legend: ✅ shipped · 🚧 in progress · 📋 planned

| Phase | Focus | Status |
| --- | --- | --- |
| 1 · Foundation | Firebase/Next.js setup, open sign-in, public handle claiming, core recipe CRUD | 🚧 Auth + onboarding shipped; recipe data model/CRUD in progress |
| 2 · Organization | Categories, tags, Algolia search, cross-user favorites & ratings | 📋 |
| 3 · Import | URL scraping (schema.org/JSON-LD) | 📋 |
| 4 · Media & Sync Polish | Photo upload, notes/tweaks, offline read caching | 📋 |
| 5 · Native iOS App | SwiftUI port sharing the Firebase backend | 📋 |
| 6 · Post-MVP | Unit conversion, ingredient scaling, cook mode, cook history, shopping lists, OCR import | 📋 |
| 7 · Community | Following, comments | 📋 |

Full detail in [docs/prd.md](docs/prd.md).

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Firebase — Firestore, Cloud Storage, Auth, Cloud Functions
- **Hosting:** Firebase App Hosting (SSR)
- **Search:** Algolia (Phase 2)
- **Testing:** Vitest (unit), Playwright (e2e)
- **iOS (Phase 5):** SwiftUI, sharing the same Firebase backend

## Documentation

- **Product** — [PRD](docs/prd.md)
- **Specs** — [Recipe data model](docs/specs/recipe.md), [Identity/auth data model](docs/specs/identity.md)
- **Flows** — [Sign-up flow](docs/flows/sign-up-flow.md), [Create recipe from form](docs/flows/create-recipe-from-form.md)

## Getting Started

Requires [pnpm](https://pnpm.io) and the [Firebase CLI](https://firebase.google.com/docs/cli) for local emulators.

```bash
pnpm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_FIREBASE_API_KEY; emulator hosts are already defaulted
pnpm emulators                # Auth/Firestore/Functions emulators + Emulator UI at localhost:4000
pnpm dev                      # in a second terminal — app at localhost:3000
```

Other useful scripts:

```bash
pnpm test        # unit tests (Vitest)
pnpm test:e2e     # e2e tests (Playwright)
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
```

## Contributing

📋 Not yet open to external contributions — this is early, solo development. That may change once the core experience stabilizes.

## License

📋 Not yet decided.
