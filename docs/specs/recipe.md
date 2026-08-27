# Recipe App — Technical Design

_Companion doc: [prd.md](../prd.md) covers product scope, goals, features, and phasing. This doc covers the data model, security rules, and other implementation details referenced from there._

## Data Model

_See also: [identity.md](identity.md) for the `profiles`/`handles`
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
| Import source URL | `isBasedOn`                 | present only for URL imports; gives attribution and a link back to the source — see `importSourceType` below for the app-specific field covering all three import methods |

App-specific fields with no schema.org equivalent, and not publishable recipe content: personal notes/tweaks and cook history. Since recipe documents are always publicly readable (see below) and Firestore security rules are document-level, not field-level, these live in a `recipes/{recipeId}/private/{ownerId}` subcollection rather than as fields on the recipe doc itself — the doc ID is the owner's uid so `request.auth.uid == ownerId` is a direct rule check with no lookup, and `ownerId` is also stored as a field so the subcollection is queryable via a collection-group query (e.g. a future "all my notes" view).

Import source is public rather than privatized: an `importSourceType: "url" | "photo" | "manual"` field lives directly on the recipe doc, so showing how a recipe was added doubles as a lightweight showcase of the app's URL-scraping and OCR import features. For `"url"` imports, the schema.org-aligned `isBasedOn` field (see table above) carries the original URL, giving proper attribution and a link back to the source.

Ingredients are stored as structured records, not raw strings, so scaling and unit conversion can operate on them directly — schema.org's `recipeIngredient` (an array of strings) is generated from this data at read time rather than stored as-is. Each recipe embeds an array of ingredient objects (order is implicit in array position):

```ts
interface RecipeIngredient {
  name: string; // e.g. "all-purpose flour"
  amount?: number; // required unless rawOverride is set — e.g. 250; plain number, Firestore has no fixed-point type, so rounding happens at format time rather than via DECIMAL storage
  unit?: StandardUnit; // required unless rawOverride is set — e.g. "gram", "cup", "piece"
  preparation?: string; // e.g. "sifted"
  notes?: string; // e.g. "room temperature"
  rawOverride?: string; // escape hatch for non-standard entries ("pinch of salt", "juice of 1 lemon") — skips structured scaling/conversion for that line
}
```

Unit conversion covers same-type conversions only (mass⇄mass via grams, volume⇄volume via ml) — converting across types (e.g. cups of flour → grams) needs ingredient-specific density data and isn't covered by this model; see Open Questions.

Every recipe also carries `ownerId` (Firebase Auth uid), set from Phase 1 since sign-up is open to any account (see [identity.md](identity.md)), not a single owner. Recipes are always publicly readable, including unauthenticated reads, so browsing and viewing a direct link are the same page under the same security rule — only writes are restricted, requiring `request.auth.uid == ownerId`.

Any authenticated user — not just the recipe's owner — can favorite a recipe or leave a thumbs up/down rating, both visible as counts to logged-out visitors on the recipe page and on list views. `favoriteRecipes` is a top-level collection, one doc per `(userId, recipeId)` with doc ID `${userId}_${recipeId}`, a reference to the original recipe — not a copy, per the "save, not fork" model. Ratings are thumbs up/down, not stars: a `recipes/{recipeId}/ratings/{userId}` subcollection, doc ID = the rater's uid (so one vote per user per recipe falls out of the structure) with a `value: "up" | "down"` field. Because counts need to render on list pages without an extra query per recipe, the recipe doc carries denormalized `favoriteCount`, `thumbsUpCount`, and `thumbsDownCount` fields, kept in sync by a Cloud Function trigger (`onWrite` on `favoriteRecipes` and on the `ratings` subcollection, via `FieldValue.increment`) rather than by client writes — security rules reject any client attempt to write those three fields directly. This is the project's first hand-written Cloud Function; a trigger was chosen over a server route (using the existing session-cookie/Admin SDK bridge) because it fires on the Firestore write itself regardless of which client made it, covering the future native iOS app for free rather than requiring its own HTTP round-trip through the Next.js server. Because the trigger updates the aggregate fields asynchronously, after the interaction doc is already written, the favorite/rating UI needs optimistic updates — toggle the button and adjust the shown count immediately on click, then reconcile with the real value once the trigger's update lands (or roll back on failure) — rather than waiting on the aggregate fields to change.

Deleting a recipe needs a second Cloud Function trigger — `onDelete` on `recipes/{recipeId}` — to recursively delete its `private` and `ratings` subcollections via the Admin SDK's recursive delete, plus an explicit query-and-batch-delete of any matching `favoriteRecipes` docs (`where recipeId == recipeId`), since that's a top-level collection and isn't reached by the recursive delete. Firestore doesn't cascade-delete subcollections when a parent document is deleted, so without this, personal notes/cook history, every rater's vote, and every favorite reference would silently outlive the recipe as orphaned, unreachable documents.

Separately, the recipe detail page needs a fallback for when the recipe doc simply doesn't exist — a stale bookmark, a shared link, or a client that had the page loaded before a delete lands — showing "This recipe has been deleted by the owner" rather than a raw not-found error. This covers direct navigation to a deleted recipe regardless of whether it was ever favorited.

Phase 7 adds a per-recipe `comments` subcollection, each comment carrying its own `authorId`, readable by anyone who can read the parent recipe, writable only by the comment's own author.

## Technical Considerations

- **Platform:** Web app first — Next.js (React + TypeScript). Native iOS (Swift/SwiftUI) as a later phase. Two separate codebases sharing the same Firebase backend, no Android.
- **Hosting:** Next.js needs SSR support, so plain Firebase Hosting (static-only) isn't sufficient. Decided on Firebase App Hosting (`apphosting.yaml`) — besides supporting Next.js SSR directly, its runtime provides ambient Application Default Credentials, which is what lets `firebase-admin` run server-side (see Auth below) without a service-account key to manage.
- **Auth:** Firebase Auth, Google OAuth and email/password, open to any account from Phase 1 — see [identity.md](identity.md) for the `profiles`/`handles` model backing public identity. Firestore/Storage security rules key off each recipe's `ownerId` for writes (`request.auth.uid == ownerId`); reads are always allowed, including unauthenticated. Favoriting and rating are open to any authenticated user, not owner-restricted, via their own `favoriteRecipes`/`ratings` docs — though the recipe doc's aggregate count fields are Cloud-Function-only, see Data Model. Comments (Phase 7) follow the ownerId/authorId write pattern per-item. Client-side auth state alone can't drive server-side logic (no cookie, no header for the Next.js server to read), so a session-cookie bridge (`firebase-admin`, `src/proxy.ts`, `/api/session`) mirrors the client's Firebase Auth state into an `httpOnly` cookie the server can verify — see [sign-up-flow.md](../flows/sign-up-flow.md#server-side-session) for the full mechanism. This is what will let future server-side Firestore reads (e.g. fetching a user's recipe collection) scope to the verified `uid` via the Admin SDK, rather than routing every read through the client SDK.
- **Backend/Sync:** Firebase (Firestore + Storage) for all backend needs
- **Billing plan:** Requires Blaze (pay-as-you-go), not Spark (free) — as of Feb 2026, Cloud Storage for Firebase needs a linked billing account to create a bucket at all, and both the Algolia sync extension and Firebase App Hosting (if chosen) run on Cloud Functions/Cloud Run, which are Blaze-only. Firestore and Auth usage stay within Spark's free quotas regardless. For early, low-traffic volume, expected bill is $0/month (Storage also has its own Always Free tier on top), but set a Cloud Billing budget alert as a safety net — more relevant once the app is public-facing from launch, given every recipe page is open to arbitrary traffic from Phase 1.
- **Search:** Algolia (free "Build" tier: 1M records, 10,000 searches/month — well above early-stage volume) for search/filter by name, ingredient, and tag, since Firestore doesn't support full-text/array search well. Synced via the official Firebase "Search with Algolia" extension, which mirrors the `Recipe` collection into an Algolia index on every write — no hand-written sync Cloud Function needed. Free-tier apps are deleted after 60 days of inactivity, worth a periodic keepalive if usage lapses. Since all recipes are public, the whole collection can sync as-is with no per-user filtering on the search key. The Firebase Emulator Suite's Extensions Emulator runs the extension's Cloud Function locally (triggered by writes to the Firestore emulator), but there's no Algolia emulator — the actual indexing call still hits Algolia's live API with a real Admin API key, so a local emulator run genuinely writes to whatever Algolia app is configured, not a sandboxed local one. Use a separate Algolia app for local/dev testing (also noted in Open Questions) so Phase 2 development doesn't write into the production index.
- **Offline:** v1 supports offline _reads_ via Firestore's built-in local cache — recipes you've viewed stay available without connectivity. Offline _writes_ (editing/creating while offline) deferred to post-MVP; low conflict risk since each recipe has a single editor (no shared/co-edited recipes — see prd.md's Non-Goals), but queuing/sync logic adds complexity not worth it for v1.
- **URL import:** needs a scraping approach (recipe schema.org/JSON-LD parsing where available, fallback heuristics otherwise). If a site blocks scraping or has no structured data, show a friendly error and suggest the user take a full-page screenshot as a fallback import method.
- **OCR:** `tesseract.js` (pure JS/WASM port of Tesseract, runs in-browser or in a Next.js API route), deferred to post-MVP
- **Images:** Firebase Storage for photos (device storage won't survive sync/reinstall)

## Open Questions

- Algolia local testing (Phase 2): confirm whether a dedicated dev/test Algolia app is set up before the sync extension is installed locally, and how its Admin API key is supplied to the emulated extension (same local-secret pattern as `firebase-admin`/App Hosting secrets — see [sign-up-flow.md](../flows/sign-up-flow.md#server-side-session)) without committing it.
- Ingredient string parsing: turning free text into the structured `RecipeIngredient` shape needs a shared parser — fractions, ranges ("2-3 cups"), compound units ("1 lb 2 oz"). Used by two features (Phase 3 URL-scraped `recipeIngredient` strings, and the MVP's paste-and-auto-split manual entry) — worth designing once rather than twice. Note this is needed regardless of unit conversion/scaling timing, since manual entry and import both populate the structured fields from day one.
- Volume-to-mass conversion: converting between volume and mass units (e.g. cups of flour → grams) needs ingredient-specific density data, which the current unit-conversion approach doesn't provide. Decide whether this is in scope (requires a density table) or deferred (same-type conversions only), whenever Phase 6 conversion work starts.
