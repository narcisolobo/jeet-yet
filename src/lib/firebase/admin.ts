import "server-only";

import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (process.env.NODE_ENV === "development") {
  // Local dev talks only to the emulators — there's no real credential to
  // find. Without this, the Admin SDK's default-credential lookup falls
  // through to probing the GCE metadata server, which fails (we're not on
  // GCP) and logs a MetadataLookupWarning on the first Firestore/Auth call.
  process.env.METADATA_SERVER_DETECTION = "none";
}

const app =
  getApps()[0] ??
  (process.env.NODE_ENV === "development"
    ? initializeApp({ projectId: "jeet-yet" })
    : initializeApp());

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { adminAuth, adminDb };
