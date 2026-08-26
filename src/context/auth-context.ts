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
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export { AuthContext, type AuthContextValue, type Profile };
