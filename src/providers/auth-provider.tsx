"use client";

import {
  getAdditionalUserInfo,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState, type ReactNode } from "react";
import { auth, db, googleProvider } from "@/lib/firebase";
import { AuthContext } from "@/context/auth-context";

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

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
    <AuthContext value={{ user, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext>
  );
}

export default AuthProvider;
