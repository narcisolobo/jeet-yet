# Create Recipe from Form

_Companion docs: [specs/recipe.md](../specs/recipe.md) covers the `Recipe`/`RecipeIngredient` data model and security rules referenced below; [prd.md](../prd.md) covers phasing. This doc covers manual entry only — the only recipe-creation path in Phase 1. URL import (Phase 3) and OCR photo import (post-MVP) will extend or reuse parts of this flow but aren't designed yet._

## Access

Creating a recipe requires being signed in — writes require `request.auth.uid == ownerId` (see [specs/recipe.md](../specs/recipe.md)'s Auth section). The create-recipe route needs the same server-side auth gate `src/proxy.ts` already applies to `/dashboard`, `/profile`, and `/onboarding` (see [sign-up-flow.md](sign-up-flow.md#server-side-session)).

## Title & Photo

- Title — required, plain text. Maps to `name`.
- Photo — optional upload to Firebase Storage. Maps to `image`.

No visibility control appears anywhere on this form — recipes are public by default from the moment they're created, so there's no privacy decision for the user to make here.

## Description

Optional freeform textarea. Maps to `description`.

## Ingredients

The one genuinely novel piece of this form, built around paste-and-auto-split:

1. The user pastes a whole block of ingredient lines into a single textarea (e.g. copied from a note, a cookbook, or another site).
2. The app splits the paste by line.
3. Each line runs through the shared ingredient parser (still an open design item — see [specs/recipe.md](../specs/recipe.md)'s Open Questions) to populate `name`, `amount`, and `unit`.
4. A line the parser confidently decomposes renders as a structured row: amount, unit (a `StandardUnit` dropdown), name, and optional `preparation`/`notes` fields — all editable inline.
5. A line the parser can't confidently decompose (or free-form phrasing like "juice of 1 lemon" or "a pinch of salt") is flagged rather than silently converted — it renders in a "couldn't parse this line" state, showing the original pasted text with a visible marker that it needs attention. The user resolves it one of two ways: fix it into a proper structured row, or dismiss the flag to accept it as `rawOverride` — a single plain-text field instead of the structured row, skipping structured scaling/conversion for that line. `name` is still expected even when dismissed to `rawOverride`, so the line stays searchable/filterable by ingredient. This is the case `RecipeIngredient.amount`/`unit` being optional exists for.
6. The user can hand-edit any row, including manually switching a row between structured and raw-override form, whether or not it was ever flagged.
7. Rows are reorderable — array position is the ingredient's implicit order, per the data model — and the user can add a blank row manually.

## Steps

Ordered list of plain-text step blocks (one per eventual `HowToStep`), with add/remove/reorder controls.

## Servings, Prep/Cook/Total Time

Plain number/text inputs for servings; time inputs collect minutes and get converted to ISO 8601 duration (e.g. `PT15M`) before storage — the user never sees or enters `PT`-style strings directly.

## Category, Cuisine, Tags

Category, cuisine, and tags are all free text with autocomplete — not a controlled vocabulary — matching how `keywords`/tags already work, so all three fields share one interaction pattern. Autocomplete suggests values the user has already used (and later, values from other public recipes) to nudge consistency without forcing it.

Free text was chosen specifically because of Phase 3: URL import scrapes `recipeCategory`/`recipeCuisine` directly from third-party JSON-LD, and those values are inconsistent across the web ("Main Course" vs "Main" vs "Dinner" vs "entree"). A controlled vocabulary would require mapping every scraped value into a fixed list at import time — fuzzy matching, a review queue for unmapped values — whereas free text stores whatever the site says, no reconciliation step needed. It also matches schema.org itself, where both properties are plain `Text`, not enums. The tradeoff: category/cuisine facets won't be perfectly normalized ("Italian" and "italian" can coexist) — acceptable given autocomplete nudges convergence and Algolia's faceting doesn't require perfectly clean values to be useful.

## Import Source (automatic, no UI)

`importSourceType` is set to `"manual"` automatically on submit; nothing about it appears on the form. (Contrast with a future URL-import flow, where this field would be `"url"` and `isBasedOn` would be populated with the source URL.)

## What's Deliberately Not on This Form

- **Personal notes / cook history** — these live in the owner-only `recipes/{recipeId}/private/{ownerId}` subcollection. They're added later, from the recipe's own page after it exists ("I made this and have thoughts now"), not at creation time.
- **Favorites / thumbs up/down** — cross-user interactions that only make sense once the recipe exists and other people can find it; not applicable during creation.

## Submit

A plain client-side Firestore write (no Cloud Function involved — unlike `claimHandle`, there's no uniqueness contention to arbitrate server-side): creates the `recipes/{recipeId}` doc with `ownerId` set to the current uid, `dateCreated: serverTimestamp()`, and the ingredients array as assembled above. The two Cloud Function triggers described in [specs/recipe.md](../specs/recipe.md) (aggregate-count maintenance, recursive delete) don't fire here — they're scoped to favorite/rating writes and recipe deletion, not creation.

## Local Development

Filling out this form by hand repeatedly to get sample data isn't necessary for local UI work — `pnpm seed` writes a set of sample recipes directly to the emulators instead. See [specs/seed-script.md](../specs/seed-script.md).
