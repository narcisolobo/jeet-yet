# Recipe App — Technical Design

_Companion doc: [prd.md](prd.md) covers product scope, goals, features, and phasing. This doc covers the data model, security rules, and other implementation details referenced from there._

## Data Model

_See also: [collections.md](collections.md) for the `profiles`/`handles`
collections introduced for authentication/identity — not part of the
schema.org-aligned Recipe model below._

Core recipe fields are aligned to [schema.org/Recipe](https://schema.org/Recipe) so that JSON-LD scraped from recipe sites during import maps directly onto the app's data model with minimal transformation.

| Field         | schema.org property             | Notes                                |
| ------------- | -------------------------------- | ------------------------------------ |
| Title         | `name`                          |                                      |
| Description   | `description`                   |                                      |
| Photo         | `image`                         | URL or ImageObject                   |
| Ingredients   | `recipeIngredient`              | structured — see below               |
| Steps         | `recipeInstructions`            | array of `HowToStep`, or plain text  |
| Servings      | `recipeYield`                   | text or QuantitativeValue            |
| Prep time     | `prepTime`                      | ISO 8601 duration, e.g. `PT15M`      |
| Cook time     | `cookTime`                      | ISO 8601 duration                    |
| Total time    | `totalTime`                     | ISO 8601 duration                    |
| Category      | `recipeCategory`                | e.g. "entree", "dessert"             |
| Cuisine       | `recipeCuisine`                 | e.g. "Italian"                       |
| Tags          | `keywords`                      | comma-delimited or repeated          |
| Source/author | `author`                        | Person or Organization               |
| Date added    | `datePublished` / `dateCreated` |                                      |
| Diet info     | `suitableForDiet`               | future                               |
| Nutrition     | `nutrition`                     | future — NutritionInformation object |

App-specific fields with no schema.org equivalent (personal-use metadata, not publishable recipe content): favorites, thumbs up/down, personal notes/tweaks, cook history, import source type (URL / photo / manual).

Ingredients are stored as structured records, not raw strings, so scaling and unit conversion can operate on them directly — schema.org's `recipeIngredient` (an array of strings) is generated from this data at read time rather than stored as-is. Each recipe embeds an array of ingredient objects (order is implicit in array position):

```ts
interface RecipeIngredient {
  name: string; // e.g. "all-purpose flour"
  amount: number; // e.g. 250 — plain number; Firestore has no fixed-point type, so rounding happens at format time rather than via DECIMAL storage
  unit: StandardUnit; // e.g. "gram", "cup", "piece"
  preparation?: string; // e.g. "sifted"
  notes?: string; // e.g. "room temperature"
  rawOverride?: string; // escape hatch for non-standard entries ("pinch of salt", "juice of 1 lemon") — skips structured scaling/conversion for that line
}
```

Unit conversion covers same-type conversions only (mass⇄mass via grams, volume⇄volume via ml) — converting across types (e.g. cups of flour → grams) needs ingredient-specific density data and isn't covered by this model; see Open Questions.

Every recipe also carries `ownerId` (Firebase Auth uid) and `visibility` (`"private" | "public"`, default `"private"`) — necessary from Phase 1 since sign-up is open to any account (see [collections.md](collections.md)), not a single owner. `/share/[recipeId]` reads the recipe doc directly and checks `visibility == "public"`, so no separate denormalized "shared recipes" collection is needed.

Phase 7 adds two new collections: `savedRecipes` (one doc per `(savedByUserId, recipeId)`, a reference to the original recipe — not a copy, per the "save, not fork" model) and per-recipe `comments`/`ratings` (each carrying its own `authorId`, readable by anyone who can read the parent recipe, writable only by the comment's own author).

## Technical Considerations

- **Platform:** Web app first — Next.js (React + TypeScript). Native iOS (Swift/SwiftUI) as a later phase. Two separate codebases sharing the same Firebase backend, no Android.
- **Hosting:** Next.js needs SSR support, so plain Firebase Hosting (static-only) isn't sufficient. Decided on Firebase App Hosting (`apphosting.yaml`) — besides supporting Next.js SSR directly, its runtime provides ambient Application Default Credentials, which is what lets `firebase-admin` run server-side (see Auth below) without a service-account key to manage.
- **Auth:** Firebase Auth, Google OAuth and email/password, open to any account from Phase 1 — see [collections.md](collections.md) for the `profiles`/`handles` model backing public identity. Firestore/Storage security rules key off each recipe's `ownerId`: writes always require `request.auth.uid == ownerId`; reads are allowed for the owner or when the recipe's `visibility` is `public` (unauthenticated reads included). Comments/ratings (Phase 7) follow the same pattern per-item via their own `authorId`. Client-side auth state alone can't drive server-side logic (no cookie, no header for the Next.js server to read), so a session-cookie bridge (`firebase-admin`, `src/proxy.ts`, `/api/session`) mirrors the client's Firebase Auth state into an `httpOnly` cookie the server can verify — see [sign-up-flow.md](sign-up-flow.md#server-side-session) for the full mechanism. This is what will let future server-side Firestore reads (e.g. fetching a user's recipe collection) scope to the verified `uid` via the Admin SDK, rather than routing every read through the client SDK.
- **Sharing:** Next.js gives a natural path to public share pages (`/share/[recipeId]`) within the same project — the page reads the recipe doc directly and checks `visibility == "public"`, reusing the same security rule as public browsing rather than a separate mechanism.
- **Backend/Sync:** Firebase (Firestore + Storage) for all backend needs
- **Billing plan:** Requires Blaze (pay-as-you-go), not Spark (free) — as of Feb 2026, Cloud Storage for Firebase needs a linked billing account to create a bucket at all, and both the Algolia sync extension and Firebase App Hosting (if chosen) run on Cloud Functions/Cloud Run, which are Blaze-only. Firestore and Auth usage stay within Spark's free quotas regardless. For early, low-traffic volume, expected bill is $0/month (Storage also has its own Always Free tier on top), but set a Cloud Billing budget alert as a safety net — more relevant once Phase 7 exposes public pages to arbitrary traffic.
- **Search:** Algolia (free "Build" tier: 1M records, 10,000 searches/month — well above early-stage volume) for search/filter by name, ingredient, and tag, since Firestore doesn't support full-text/array search well. Synced via the official Firebase "Search with Algolia" extension, which mirrors the `Recipe` collection into an Algolia index on every write — no hand-written sync Cloud Function needed. Free-tier apps are deleted after 60 days of inactivity, worth a periodic keepalive if usage lapses. Since multiple accounts (each with private-by-default recipes) exist from Phase 1, and this sync is set up in Phase 2, the index needs to exclude private recipes from anything queryable by a client-side search key from the start — either sync public recipes only, or use Algolia's secured API keys with a per-request filter (each user searching only their own + public recipes) — noted in Open Questions. The Firebase Emulator Suite's Extensions Emulator runs the extension's Cloud Function locally (triggered by writes to the Firestore emulator), but there's no Algolia emulator — the actual indexing call still hits Algolia's live API with a real Admin API key, so a local emulator run genuinely writes to whatever Algolia app is configured, not a sandboxed local one. Use a separate Algolia app for local/dev testing (also noted in Open Questions) so Phase 2 development doesn't write into the production index.
- **Offline:** v1 supports offline _reads_ via Firestore's built-in local cache — recipes you've viewed stay available without connectivity. Offline _writes_ (editing/creating while offline) deferred to post-MVP; low conflict risk since each recipe has a single editor (no shared/co-edited recipes — see prd.md's Non-Goals), but queuing/sync logic adds complexity not worth it for v1.
- **URL import:** needs a scraping approach (recipe schema.org/JSON-LD parsing where available, fallback heuristics otherwise). If a site blocks scraping or has no structured data, show a friendly error and suggest the user take a full-page screenshot as a fallback import method.
- **OCR:** `tesseract.js` (pure JS/WASM port of Tesseract, runs in-browser or in a Next.js API route), deferred to post-MVP
- **Images:** Firebase Storage for photos (device storage won't survive sync/reinstall)

## Open Questions

- Saved recipes (Phase 7): if the owner deletes or privates a recipe after someone saved it, does the save break (defer to the live original), or should saving freeze a snapshot at save time?
- Algolia privacy (Phase 2, not Phase 7 — other users already exist by then): decide how the search index excludes private recipes — sync public recipes only, vs. secured/filtered Algolia API keys.
- Algolia local testing (Phase 2): confirm whether a dedicated dev/test Algolia app is set up before the sync extension is installed locally, and how its Admin API key is supplied to the emulated extension (same local-secret pattern as `firebase-admin`/App Hosting secrets — see [sign-up-flow.md](sign-up-flow.md#server-side-session)) without committing it.
- Ingredient string parsing: turning free text into the structured `RecipeIngredient` shape needs a shared parser — fractions, ranges ("2-3 cups"), compound units ("1 lb 2 oz"). Used by two features (Phase 3 URL-scraped `recipeIngredient` strings, and the MVP's paste-and-auto-split manual entry) — worth designing once rather than twice. Note this is needed regardless of unit conversion/scaling timing, since manual entry and import both populate the structured fields from day one.
- Volume-to-mass conversion: converting between volume and mass units (e.g. cups of flour → grams) needs ingredient-specific density data, which the current unit-conversion approach doesn't provide. Decide whether this is in scope (requires a density table) or deferred (same-type conversions only), whenever Phase 6 conversion work starts.
