import "server-only";

import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const app =
  getApps()[0] ??
  (process.env.NODE_ENV === "development"
    ? initializeApp({ projectId: "jeet-yet" })
    : initializeApp());

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { adminAuth, adminDb };
