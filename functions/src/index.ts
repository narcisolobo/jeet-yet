import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { RESERVED_HANDLES } from "./reserved-handles";

initializeApp();

const HANDLE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MIN_HANDLE_LENGTH = 3;
const MAX_HANDLE_LENGTH = 30;

function isValidHandle(handle: unknown): handle is string {
  return (
    typeof handle === "string" &&
    handle.length >= MIN_HANDLE_LENGTH &&
    handle.length <= MAX_HANDLE_LENGTH &&
    HANDLE_PATTERN.test(handle)
  );
}

export const claimHandle = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to claim a handle.",
    );
  }

  const handle: unknown = (request.data as { handle?: unknown } | null)
    ?.handle;
  const uid = request.auth.uid;

  if (!isValidHandle(handle)) {
    throw new HttpsError(
      "invalid-argument",
      "Handle must be 3-30 characters: lowercase letters, numbers, and single hyphens only.",
    );
  }

  if (RESERVED_HANDLES.has(handle)) {
    throw new HttpsError("already-exists", "That handle is already taken.");
  }

  const db = getFirestore();
  const handleRef = db.doc(`handles/${handle}`);
  const profileRef = db.doc(`profiles/${uid}`);

  await db.runTransaction(async (tx) => {
    const [handleSnap, profileSnap] = await Promise.all([
      tx.get(handleRef),
      tx.get(profileRef),
    ]);

    if (!profileSnap.exists) {
      throw new HttpsError(
        "failed-precondition",
        "No profile found for this account.",
      );
    }
    if (handleSnap.exists) {
      throw new HttpsError("already-exists", "That handle is already taken.");
    }

    tx.set(handleRef, { uid });
    tx.update(profileRef, { handle });
  });

  return { handle };
});
