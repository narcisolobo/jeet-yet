# Auth Flow

## Sign-In

User clicks "Sign in with Google" → `signInWithGoogle` in `auth-provider.tsx` calls `signInWithPopup(auth, googleProvider)`. (Not `signInWithRedirect` — popup keeps the whole flow, including the new-user check below, in one place without a full-page round trip. Revisit only if popup-blocking becomes a real problem in practice; the rest of this flow is unaffected either way.)

## Detect New User

From the `UserCredential` resolved by `signInWithPopup`, check `getAdditionalUserInfo(userCredential)?.isNewUser`.

- **New user** → create `profiles/{uid}` immediately (client-side write, a user is always allowed to create their own profile doc):
  - `uid`, `email`, `displayName`, `photoURL` from the Firebase `User` (no need to dig out Google's raw `sub` — Firebase's `uid` already is the stable per-account identifier and doubles as the doc ID)
  - `handle: null`
  - `createdAt: serverTimestamp()`
- **Returning user** → no write; existing `profiles/{uid}` is read as usual.

## Onboarding Route

New/incomplete users are routed to a dedicated `/onboarding` page rather than a dialog mounted globally at the app root:

- Right after sign-in, if `getAdditionalUserInfo(userCredential)?.isNewUser` is true — or, for a returning session, `profiles/{uid}.handle` is still `null` — route to `/onboarding` instead of `/dashboard`.
- `/onboarding` guards the reverse case: if `handle` is already set, redirect straight to `/dashboard` (so back/forward navigation or a stale bookmark can't reopen the picker after it's done).
- `/dashboard` (and any other authenticated route) guards against `handle` still being `null`, redirecting back to `/onboarding` — so an incomplete user can't skip the picker by navigating there directly.

This means a user who reloads or returns in a later session before finishing still lands back on the picker, without needing a root-level listener to decide whether to show it on every route.

**Derive a suggested handle:** `generateHandle(user)`
(`src/lib/utils/generate-handle.ts`) — sanitizes and hyphenates `displayName` or the email prefix, falling back to a random `adjective-color-animal` handle (e.g. `big-red-donkey`) if neither yields anything usable.

**Prompt:** the `/onboarding` page renders a shadcn `AlertDialog`, "Choose your public handle: `@suggested-handle`", editable before confirming.

## Claim Handle

Uniqueness can't be enforced with a plain read-then-write — two users choosing the same handle at the same moment would race. Claim it through a callable Cloud Function, `claimHandle(handle)` (`functions/src/index.ts`),
that runs a single Firestore transaction:

1. Reject up front if `handle` isn't 3-30 characters of lowercase letters, digits, and single hyphens (no leading/trailing/doubled hyphens).
2. Read `handles/{handle}` and `profiles/{uid}` together.
3. If the profile doesn't exist → `failed-precondition` (defensive; shouldn't happen in practice since Detect New User always creates it first).
4. If `handles/{handle}` exists → throw `already-exists` back to the client (seen there as `functions/already-exists`; the handle picker shows "That handle is already taken — try another" and lets the user edit and retry).
5. Otherwise → write `handles/{handle} = { uid }` and `profiles/{uid}.handle = handle` atomically.

Doing the claim server-side (rather than trusting client Firestore rules for it) keeps the uniqueness transaction and format validation in one auditable place — there's no profanity check yet, just the format rule above. The initial `profiles/{uid}` creation above stays a plain client write since it only ever touches the caller's own doc and holds no contested/unique field.

## Redirect

Once `claimHandle` resolves successfully, `/onboarding` routes to `/dashboard`.

## Server-Side Session

Firebase Auth state otherwise lives only in the browser (the client SDK's `onAuthStateChanged`), which the Next.js server has no way to read — no cookie, no header. That blocks any server-side auth check (redirecting unauthenticated requests before a page even renders) and any server-side Firestore read scoped to the signed-in user (needed once collections are fetched server-side, per [collections.md](collections.md)). A session-cookie bridge closes that gap:

- After `signInWithEmail`, `signUpWithEmail`, or `signInWithGoogle` resolves client-side, `syncSessionCookie` (`src/lib/firebase/session-client.ts`) takes a fresh ID token (`user.getIdToken()`) and `POST`s it to `/api/session` (`src/app/api/session/route.ts`), which verifies the token, checks it's from a recent sign-in (`auth_time` within 5 minutes), and mints an `httpOnly` session cookie (`__session`) via `firebase-admin`'s `createSessionCookie` (`src/lib/firebase/admin.ts`). `signOutUser` clears it via `DELETE /api/session`.
- `src/proxy.ts` — this Next.js version's renamed `middleware.ts` (see `AGENTS.md`; the Edge runtime is no longer supported, so `proxy.ts` always runs on Node, letting `firebase-admin` verify the cookie directly instead of only checking for its presence) — guards `/dashboard`, `/profile`, and `/onboarding`, redirecting to `/auth/sign-in` server-side before any page code runs if the cookie is missing or fails `verifySessionCookie`. This is what actually stops a logged-out visitor from ever seeing a flash of protected content; the client-side redirect effects on those pages (Onboarding Route, above) stay in place as defense-in-depth for a cookie that's momentarily stale relative to fresh client state.
- **Race to watch for:** `signInWithEmailAndPassword`/`signInWithPopup` update the client's `user` state (via `onAuthStateChanged`) as part of resolving, before `syncSessionCookie`'s round trip finishes. A redirect effect that fires as soon as `user` is truthy will navigate into a `proxy.ts`-protected route before the cookie exists, get bounced back to `/auth/sign-in`, and then never retry (its dependencies haven't changed). The auth context exposes `sessionSyncing` — true for the duration of each `syncSessionCookie` call — and the `/auth/sign-in` and `/auth/sign-up` pages' redirect effects wait for it to clear before navigating.
