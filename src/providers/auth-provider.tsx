"use client";

import {
  getAdditionalUserInfo,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState, type ReactNode } from "react";
import { auth, db, googleProvider } from "@/lib/firebase";
import { AuthContext, type Profile } from "@/context/auth-context";

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileDoc, setProfileDoc] = useState<Profile | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "profiles", user.uid), (snapshot) => {
      setProfileDoc(snapshot.exists() ? (snapshot.data() as Profile) : null);
    });
  }, [user]);

  // Guards against briefly showing a previous user's profile after sign-out
  // followed by a different account signing in, before the new snapshot fires.
  const profile = profileDoc?.uid === user?.uid ? profileDoc : null;
  const profileLoading = Boolean(user) && profileDoc?.uid !== user?.uid;

  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      if (getAdditionalUserInfo(result)?.isNewUser) {
        const { uid, email, displayName, photoURL } = result.user;
        await setDoc(doc(db, "profiles", uid), {
          uid,
          email,
          displayName,
          photoURL,
          handle: null,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "auth/popup-closed-by-user"
      ) {
        return;
      }
      console.error("Google sign-in failed:", error);
    }
  }

  async function signOutUser() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }

  return (
    <AuthContext
      value={{
        user,
        loading,
        profile,
        profileLoading,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </AuthContext>
  );
}

export default AuthProvider;
