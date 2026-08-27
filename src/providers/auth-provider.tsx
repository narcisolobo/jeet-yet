"use client";

import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useEffect, useState, type ReactNode } from "react";
import { auth, db, functions, googleProvider } from "@/lib/firebase";
import { clearSessionCookie, syncSessionCookie } from "@/lib/firebase/session-client";
import { AuthContext, type Profile } from "@/context/auth-context";

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileDoc, setProfileDoc] = useState<Profile | null>(null);
  const [sessionSyncing, setSessionSyncing] = useState(false);

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

      setSessionSyncing(true);
      try {
        await syncSessionCookie(result.user);
      } catch (error) {
        console.error("Session sync failed:", error);
      } finally {
        setSessionSyncing(false);
      }

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

  async function signUpWithEmail(email: string, password: string) {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    setSessionSyncing(true);
    try {
      await syncSessionCookie(user);
    } catch (error) {
      console.error("Session sync failed:", error);
    } finally {
      setSessionSyncing(false);
    }
    const { uid, email: userEmail, displayName, photoURL } = user;
    await setDoc(doc(db, "profiles", uid), {
      uid,
      email: userEmail,
      displayName,
      photoURL,
      handle: null,
      createdAt: serverTimestamp(),
    });
  }

  async function signInWithEmail(email: string, password: string) {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    setSessionSyncing(true);
    try {
      await syncSessionCookie(user);
    } catch (error) {
      console.error("Session sync failed:", error);
    } finally {
      setSessionSyncing(false);
    }
  }

  async function signOutUser() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      try {
        await clearSessionCookie();
      } catch (error) {
        console.error("Session clear failed:", error);
      }
    }
  }

  async function claimHandle(handle: string) {
    const claim = httpsCallable<{ handle: string }, { handle: string }>(
      functions,
      "claimHandle",
    );
    await claim({ handle });
  }

  return (
    <AuthContext
      value={{
        user,
        loading,
        profile,
        profileLoading,
        sessionSyncing,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        signOutUser,
        claimHandle,
      }}
    >
      {children}
    </AuthContext>
  );
}

export default AuthProvider;
