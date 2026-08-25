# Recipe App — PRD

_Companion doc: [technical-design.md](technical-design.md) covers the data model, security rules, and other implementation details. This doc covers product scope, goals, and phasing._

## Overview

A personal recipe app, starting as a single-user tool for me and later opening up to other users with their own independent collections, replacing existing apps that handle recipe import poorly. Building the front end with Next.js (React/TS), with a native iOS app (SwiftUI) as a later phase, synced across my own devices via a shared Firebase backend.

## Problem Statement

Existing recipe apps are bad at getting recipes _into_ the app — scraping is unreliable, manual entry is tedious, and there's no good path for recipes that live on paper (cookbooks, handwritten cards). This app should make capturing a recipe, from any source, fast and low-friction.

## Goals

- Make it fast to save a recipe regardless of source (web, photo, memory)
- Support everyday cooking use: scaling, unit conversion, a distraction-free cook mode
- Keep recipes organized and findable as the collection grows
- Sync reliably across my own devices

## Non-Goals

- No shared/household accounts — each user owns an independent collection; there's no multi-editor access to the same recipes (see Phase 7 for cross-user features like following/saving)
- No monetization, ads, or third-party integrations beyond recipe import sources
- Not trying to be a meal-planning or nutrition-tracking app (may revisit later)

## User

Just me, through the MVP and Phases 1–6 — no personas needed, which simplifies a lot of early decisions (no permissions model beyond a single owner, no conflict resolution beyond my own devices). Phase 7 opens the app to other users, each with their own independent collection — see Development Phases.

## Features

### MVP

**Import**

- Import recipe from URL (auto-scrape title, ingredients, steps, photo, servings)
- Fast manual entry — paste a block of text, auto-split into ingredients/steps
- Source field (URL, cookbook, handwritten, own creation)

**Organization**

- Categories
- Tags
- Search/filter (by name, ingredient, tag)
- Favorites
- Thumbs up/down

**Cooking**

- Photo upload (my own photos)
- Notes/tweaks per recipe
- Sync across devices

### Post-MVP

- Unit conversion (metric ⇄ imperial)
- Ingredient scaling by servings
- Photo/OCR import (photograph a printed/handwritten recipe)
- Cook mode (step-by-step, screen-awake, built-in timers)
- Cook history (dates made, times cooked)
- Shopping list generation (merge ingredients across recipes)
- Search/filter by cook time, rating
- Public share link for a single recipe (`/share/[recipeId]`), read-only

### Community (Phase 7)

- Open sign-in to any Google account (lifts the single-account restriction)
- Per-recipe visibility toggle (public/private), default private
- Public discovery/browsing of public recipes, including for logged-out visitors
- User profiles, following other users
- Comments and ratings from other users (distinct from your own private favorites/thumbs-up)
- Save another user's recipe to your own collection (a reference to the original, not a copy/fork)

### Future / Backlog

- Sub-recipes/components (e.g. sauce nested in a main dish)
- Random recipe picker
- Bulk import (CSV/JSON from another app)

## Development Phases

**Phase 1: Foundation (web)**
Next.js project + Firebase setup (Firestore, Storage, Auth). Core `Recipe` data model. Manual entry only — no import yet. Basic list view + detail view + edit/delete. Goal: full create-save-view-edit loop working end to end, gated behind sign-in.

**Phase 2: Organization (web)**
Categories, tags, search/filter, favorites, thumbs up/down. Categories/tags/favorites are UI + Firestore querying; search/filter is backed by Algolia (see [technical-design.md](technical-design.md)) — set up the Firebase-to-Algolia sync extension here.

**Phase 3: Import (web)**
URL scraping (JSON-LD/schema.org parsing + fallback error/screenshot flow). Most technically involved phase — networking, HTML parsing, error handling — sequenced after the basics are solid.

**Phase 4: Media & sync polish (web)**
Photo upload to Firebase Storage, notes/tweaks field, offline read caching validation.

**Phase 5: Native iOS app**
Port the app to SwiftUI, reusing the Firebase backend and data model designed in Phases 1–4. Ports core + organization features first; import can lag if scraping logic doesn't translate directly.

**Phase 6: Post-MVP**
Unit conversion, ingredient scaling, cook mode, cook history, shopping list generation, OCR photo import — built for whichever platform(s) make sense at that point. Ingredient records are already structured (see [technical-design.md](technical-design.md)), so conversion/scaling here is application logic on existing data, not a schema change.

**Phase 7: Community (multi-user + social)**
Opens sign-in to any Google account, builds on the `ownerId`/`visibility` fields and security rules already in place since Phase 1. Public discovery/browsing, user profiles, following, comments/ratings, save-to-my-collection. Substantial enough in scope (new data collections, moderation, discovery UI) to warrant its own phase rather than folding into Future/Backlog.

Phases 2–4 are roughly independent — if one stalls (e.g. import scraping turns into a slog), it's possible to jump to another phase without blocking overall progress. Building the web app first also means the data model and Firebase schema get battle-tested before the iOS port, which should make Phase 5 faster than starting iOS from scratch.

## Open Questions

- Screenshot fallback: does this get OCR'd automatically (post-MVP), or just saved as a reference image attached to a manually-entered recipe for now?
- Phase 7 moderation: what's the policy for public UGC (comments, public recipes) — reporting, review, takedown?
