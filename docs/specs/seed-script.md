# Local Seed Script

_Companion docs: [recipe.md](recipe.md) covers the `Recipe`/`RecipeIngredient` model this script's data matches; [identity.md](identity.md) covers the `profiles`/`handles` collections it populates; [flows/sign-up-flow.md](../flows/sign-up-flow.md) and [flows/create-recipe-from-form.md](../flows/create-recipe-from-form.md) cover the manual flows it exists to bypass for local development._

## Purpose

Getting the Firebase Emulator Suite into a useful state normally means signing up a user by hand and filling out the recipe form repeatedly — and emulator state doesn't persist across restarts, so that repeats every session. `pnpm seed` (`scripts/seed.mts`) does it in one command: wipes the emulators and writes a fixed set of test users and recipes directly via the Admin SDK, bypassing every app-level flow (sign-up, `claimHandle`, the recipe form) entirely.

## Usage

Run `pnpm emulators` in one terminal, then `pnpm seed` in a second, whenever fresh data is wanted. The script exits `0` and logs a one-line summary per resource type on success, or logs the error and exits `1` on failure.

## Emulator-only by construction

Before any Firebase import runs, the script unconditionally sets `FIREBASE_AUTH_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST`, and `FIREBASE_STORAGE_EMULATOR_HOST` to their local emulator addresses, overwriting whatever's in the ambient environment. This is a deliberate safety property, not just convenience — it makes it structurally impossible for the script to write to a real project, since the Admin SDK's target is decided before `initializeApp()` even runs.

## Wipe, then reseed

Every run wipes existing emulator state first, then writes fresh data — deterministic and safe to re-run anytime, rather than accumulating duplicates:

| Resource                                          | Wipe method                                             |
| -------------------------------------------------- | -------------------------------------------------------- |
| Auth users                                        | paginated `listUsers` + `deleteUsers`                    |
| `profiles`, `handles`, `recipes`, `favoriteRecipes` | `adminDb.recursiveDelete()` per collection (also clears recipe subcollections like `ratings`) |
| Storage objects under `recipes/`                  | `bucket.getFiles({ prefix: "recipes/" })` + delete each  |

## Seed data

`scripts/seed-data.mts` holds the data as plain objects — no Firebase imports, so it has no side effects on its own:

- **`SEED_USERS`** — 3 users with fixed, readable uids (`seed-user-1`, etc.) rather than auto-generated ones, so they're easy to recognize in the Emulator UI. Each gets a real Auth account (`createUser`, `emailVerified: true`) plus a `profiles/{uid}` doc and a `handles/{handle}` doc written directly — with `handle` already set, unlike a real sign-up where it starts `null` until claimed.
- **`SEED_RECIPES`** — 9 recipes spread across the 3 users (`ownerIndex` into `SEED_USERS`), matching the `Recipe` shape from [recipe.md](recipe.md): varied `recipeCategory`/`recipeCuisine`/`keywords`, ISO-duration prep/cook/total times, and ingredients drawn from the real `StandardUnit` list — including at least one `rawOverride` line to exercise that path. `importSourceType` is mixed across `"manual"`/`"url"`/`"photo"` for variety, even though only `"manual"` is reachable through the app today.
- **`SEED_FAVORITES`** — 3 cross-owner `favoriteRecipes` docs (e.g. one user favoriting a different user's recipe), so favoriting scenarios are exercisable without manually signing in as two accounts.

## Photos

Two `SEED_RECIPES` entries carry a `photoAsset` filename; the rest omit it, so both the with-photo and without-photo rendering paths exist in seed data. For each, the script reads the file from `scripts/seed-assets/`, uploads it to `recipes/{ownerId}/{recipeId}/photo` via the Admin Storage SDK, and sets `image` to a hand-built URL:

```
http://localhost:9199/v0/b/jeet-yet.firebasestorage.app/o/${encodeURIComponent(path)}?alt=media
```

No signed download token is needed — `storage.rules` already grants public `read: if true` on that path, and this is the same endpoint the client SDK's `getDownloadURL()` resolves to against the emulator, so hardcoding it is a reasonable shortcut for a script that isn't going through the client SDK.

`scripts/seed-assets/` itself is gitignored (aside from a `.gitkeep`) — it's not populated by the script or committed to the repo. Drop in your own images with matching filenames before running `pnpm seed` if you want the photo-bearing recipes to have real images; without them, `uploadPhoto` throws and the run fails.

## Known gaps

- **Bypasses security rules and Cloud Functions.** Writes go through the Admin SDK directly, not through `claimHandle` or the recipe form's client-side write — so validation living in those paths (handle format/reserved-word checks, form-level requirements) never runs against seed data.
- **Aggregate count fields stay unset.** `favoriteCount`/`thumbsUpCount`/`thumbsDownCount` are Cloud-Function-maintained only (see [recipe.md](recipe.md)); the seed script deliberately doesn't hand-write them, since that would just be a second implementation to drift from the real trigger. They only populate if the Functions emulator is also running (`firebase emulators:start` includes it by default) and picks up the seeded `favoriteRecipes` writes via its `onWrite` trigger.
- **No ingredient parsing.** `SEED_RECIPES` ingredients are already-structured data, not run through the `ingredient-parser` Python Cloud Function the way pasted text from the real form is — so the flagged/unresolved-ingredient UX has nothing to exercise from seed data alone.

## File layout

- `scripts/seed.mts` — the executable entry point (wipe → seed users → seed recipes → seed favorites)
- `scripts/seed-data.mts` — the seed content
- `scripts/seed-assets/` — gitignored, user-supplied photo files
