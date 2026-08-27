import { createContext } from "react";
import type { User } from "firebase/auth";

interface Profile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  handle: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  profile: Profile | null;
  profileLoading: boolean;
  sessionSyncing: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  claimHandle: (handle: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export { AuthContext, type AuthContextValue, type Profile };
