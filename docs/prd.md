# Recipe App — PRD

_Companion doc: [technical-design.md](technical-design.md) covers the data model, security rules, and other implementation details. This doc covers product scope, goals, and phasing._

## Overview

A recipe app open to any user from the start, each with their own independent collection, replacing existing apps that handle recipe import poorly. Building the front end with Next.js (React/TS), with a native iOS app (SwiftUI) as a later phase, synced across devices via a shared Firebase backend. Social/community features (following, public discovery, comments) are deferred to Phase 7 — see Development Phases.

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

Open to any user from Phase 1 onward — anyone can sign in (Google or email/password) and gets their own independent collection, identified by a public handle (see [collections.md](collections.md)). No conflict resolution beyond a single user's own devices, since collections aren't shared/co-edited (see Non-Goals). Phase 7 adds the social layer on top — following, public discovery, comments/ratings — see Development Phases.

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

- Per-recipe visibility toggle (public/private), default private
- Public discovery/browsing of public recipes, including for logged-out visitors
- Following other users (profiles/handles already exist from Phase 1 — see [collections.md](collections.md))
- Comments and ratings from other users (distinct from your own private favorites/thumbs-up)
- Save another user's recipe to your own collection (a reference to the original, not a copy/fork)

### Future / Backlog

- Sub-recipes/components (e.g. sauce nested in a main dish)
- Random recipe picker
- Bulk import (CSV/JSON from another app)

## Development Phases

**Phase 1: Foundation (web)**
Next.js project + Firebase setup (Firestore, Storage, Auth). Open sign-in (Google + email/password, any account) with `profiles`/`handles` collections backing a public username claim (see [collections.md](collections.md)). Core `Recipe` data model. Manual entry only — no import yet. Basic list view + detail view + edit/delete. Goal: full create-save-view-edit loop working end to end, gated behind sign-in.

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

**Phase 7: Community (social layer)**
Builds on the `ownerId`/`visibility` fields and security rules already in place since Phase 1, plus the `profiles`/`handles` collections already backing sign-in since Phase 1. Adds the remaining social layer: public discovery/browsing, following, comments/ratings, save-to-my-collection. Substantial enough in scope (moderation, discovery UI, new `savedRecipes`/`comments`/`ratings` collections) to warrant its own phase rather than folding into Future/Backlog.

Phases 2–4 are roughly independent — if one stalls (e.g. import scraping turns into a slog), it's possible to jump to another phase without blocking overall progress. Building the web app first also means the data model and Firebase schema get battle-tested before the iOS port, which should make Phase 5 faster than starting iOS from scratch.

## Open Questions

- Screenshot fallback: does this get OCR'd automatically (post-MVP), or just saved as a reference image attached to a manually-entered recipe for now?
- Phase 7 moderation: what's the policy for public UGC (comments, public recipes) — reporting, review, takedown?
