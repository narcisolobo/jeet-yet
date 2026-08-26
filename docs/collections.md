# Firestore Collections — Authentication & Identity

_Companion doc: [technical-design.md](technical-design.md) covers the
`Recipe`/`RecipeIngredient` data model and the recipe app's product-level
phasing. This doc covers collections introduced for authentication/identity
that aren't part of that schema.org-aligned model — see
[sign-up-flow.md](sign-up-flow.md) for the flow that populates them._

## `profiles/{uid}`

One document per signed-in user, keyed by their Firebase Auth `uid` (not an
auto-generated ID) — chosen for O(1) lookups and trivial security rules, at
the cost of `uid` appearing in the client's own Firestore path. That's only
visible to that user's own requests, never to other users or in any app
URL — the public-facing route is keyed by `handle`, not `uid`.

| Field         | Type             | Notes                                                                             |
| ------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `uid`         | `string`         | Firebase Auth uid; duplicated as a field (also the doc ID) so it's available on documents returned from a query, not just a direct `get` |
| `email`       | `string \| null` | from the Firebase `User`, captured at first sign-in                                |
| `displayName` | `string \| null` | from the Firebase `User`, captured at first sign-in                                |
| `photoURL`    | `string \| null` | from the Firebase `User`, captured at first sign-in                                |
| `handle`      | `string \| null` | public-facing username; `null` until claimed via `claimHandle` (not yet implemented) |
| `createdAt`   | `Timestamp`      | `serverTimestamp()`, set once at creation, never updated                           |

Created client-side, once, in `signInWithGoogle`
(`src/providers/auth-provider.tsx`), guarded by
`getAdditionalUserInfo(result)?.isNewUser` — written only the first time a
given Firebase account signs in, never overwritten on return visits.

**Security rule** (`firestore.rules`):

```
match /profiles/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

A user can only read/write their own profile document.

## `handles/{handle}` — planned, not yet implemented

A reservation collection enforcing handle uniqueness, since Firestore has no
unique-constraint mechanism. Doc ID is the handle itself (e.g.
`handles/alex-rivers`); the only field is the claiming `uid`.

Written by the planned `claimHandle` callable Cloud Function inside a single
Firestore transaction alongside `profiles/{uid}.handle` — not directly by
the client. See [sign-up-flow.md](sign-up-flow.md#claim-handle) for the full
claim flow. No dedicated security rule exists yet; `firestore.rules`' default
catch-all (`allow read, write: if false`) already denies direct client
access, which is correct since nothing should write here except the
Cloud Function (via the Admin SDK, which bypasses rules entirely).

## Phasing note

Open, multi-account sign-in (Google + email/password) and these `profiles`/
`handles` collections are Phase 1 scope — not gated behind a single
authorized account, and not deferred to Phase 7 as originally planned. See
[prd.md](prd.md)'s User section and Phase 1 description, and
[technical-design.md](technical-design.md)'s Auth bullet. Phase 7 still adds
the remaining social layer on top: public discovery, following, comments,
and ratings.
