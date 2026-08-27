# Recipe App — PRD

_Companion docs: [specs/recipe.md](specs/recipe.md) covers the recipe data model, security rules, and other implementation details; [specs/identity.md](specs/identity.md) covers the `profiles`/`handles` auth/identity model. This doc covers product scope, goals, and phasing._

## Overview

A recipe app open to any user from the start, each with their own independent collection, replacing existing apps that handle recipe import poorly. Building the front end with Next.js (React/TS), with a native iOS app (SwiftUI) as a later phase, synced across devices via a shared Firebase backend. Social/community features are split across phases — public discovery, favoriting, and ratings ship as early as Phase 2, once recipes are public by default; following and comments are deferred to Phase 7 — see Development Phases.

## Problem Statement

Existing recipe apps are bad at getting recipes _into_ the app — scraping is unreliable, manual entry is tedious, and there's no good path for recipes that live on paper (cookbooks, handwritten cards). This app should make capturing a recipe, from any source, fast and low-friction.

## Goals

- Make it fast to save a recipe regardless of source (web, photo, memory)
- Support everyday cooking use: scaling, unit conversion, a distraction-free cook mode
- Keep recipes organized and findable as the collection grows
- Sync reliably across my own devices

## Non-Goals

- No shared/household accounts — each user owns an independent collection; there's no multi-editor access to the same recipes (see Phase 7 for cross-user features like following)
- No monetization, ads, or third-party integrations beyond recipe import sources
- Not trying to be a meal-planning or nutrition-tracking app (may revisit later)

## User

Open to any user from Phase 1 onward — anyone can sign in (Google or email/password) and gets their own independent collection, identified by a public handle (see [specs/identity.md](specs/identity.md)). No conflict resolution beyond a single user's own devices, since collections aren't shared/co-edited (see Non-Goals). Phase 7 adds the remaining social layer on top — following and comments — see Development Phases.

## Features

### MVP

**Account**

- Sign in via Google or email/password — open to any account, not restricted to a single owner
- Public profile with a claimed handle (`@handle`)

**Import**

- Import recipe from URL (auto-scrape title, ingredients, steps, photo, servings)
- Fast manual entry — paste a block of text, auto-split into ingredients/steps
- Source field (URL, cookbook, handwritten, own creation)

**Organization**

- Categories
- Tags
- Search/filter (by name, ingredient, tag) — surfaces all public recipes, not just your own; this is where public discovery arrives, earlier than originally planned
- Favorites — on any public recipe, not just your own; visible as a public count
- Thumbs up/down — on any public recipe, not just your own; visible as a public count

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

### Community (Phase 7)

- Following other users (profiles/handles already exist from Phase 1 — see [specs/identity.md](specs/identity.md))
- Comments on any public recipe

### Future / Backlog

- Sub-recipes/components (e.g. sauce nested in a main dish)
- Random recipe picker
- Bulk import (CSV/JSON from another app)

## Development Phases

**Phase 1: Foundation (web)**
Next.js project + Firebase setup (Firestore, Storage, Auth). Open sign-in (Google + email/password, any account) with `profiles`/`handles` collections backing a public username claim (see [specs/identity.md](specs/identity.md)). Core `Recipe` data model. Manual entry only — no import yet. Basic list view + detail view + edit/delete. Goal: full create-save-view-edit loop working end to end, gated behind sign-in.

**Phase 2: Organization (web)**
Categories, tags, search/filter, favorites, thumbs up/down. Categories/tags are UI + Firestore querying. Favorites and thumbs up/down are cross-user — any signed-in user, on any public recipe — backed by new `favoriteRecipes`/`ratings` collections plus a Cloud Function trigger maintaining denormalized counts on the recipe doc, and a second trigger cleaning those up on recipe delete (see [specs/recipe.md](specs/recipe.md)). Search/filter is backed by Algolia — set up the Firebase-to-Algolia sync extension here; since all recipes are public, this is also where public discovery arrives, ahead of the original Phase 7 plan.

**Phase 3: Import (web)**
URL scraping (JSON-LD/schema.org parsing + fallback error/screenshot flow). Most technically involved phase — networking, HTML parsing, error handling — sequenced after the basics are solid.

**Phase 4: Media & sync polish (web)**
Photo upload to Firebase Storage, notes/tweaks field, offline read caching validation.

**Phase 5: Native iOS app**
Port the app to SwiftUI, reusing the Firebase backend and data model designed in Phases 1–4. Ports core + organization features first; import can lag if scraping logic doesn't translate directly.

**Phase 6: Post-MVP**
Unit conversion, ingredient scaling, cook mode, cook history, shopping list generation, OCR photo import — built for whichever platform(s) make sense at that point. Ingredient records are already structured (see [specs/recipe.md](specs/recipe.md)), so conversion/scaling here is application logic on existing data, not a schema change.

**Phase 7: Community (social layer)**
Builds on the `ownerId` field and security rules already in place since Phase 1, plus the `profiles`/`handles` collections already backing sign-in since Phase 1. Public discovery, favoriting, and ratings all shipped earlier than originally planned (Phase 2) once the app moved to public-by-default, so what's left here is smaller than the original plan: following and comments — a new `comments` subcollection, following UI, and moderation for both.

Phases 2–4 are roughly independent — if one stalls (e.g. import scraping turns into a slog), it's possible to jump to another phase without blocking overall progress. Building the web app first also means the data model and Firebase schema get battle-tested before the iOS port, which should make Phase 5 faster than starting iOS from scratch.

## Open Questions

- Screenshot fallback: does this get OCR'd automatically (post-MVP), or just saved as a reference image attached to a manually-entered recipe for now?
- Moderation: recipes (and favorites/ratings) have been public since Phase 1, so abuse handling — reporting, review, takedown — may need to exist well before Phase 7's comments feature makes it a hard requirement. Decide whether basic reporting is worth pulling into an earlier phase.
