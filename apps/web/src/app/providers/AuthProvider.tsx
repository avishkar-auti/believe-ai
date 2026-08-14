import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth";
import { firebaseAuth, googleAuthProvider } from "../../lib/firebase.js";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
  }, []);

  const value: AuthContextValue = {
    firebaseUser,
    loading,
    signInWithGoogle: async () => {
      await signInWithPopup(firebaseAuth, googleAuthProvider);
    },
    signInWithEmail: async (email, password) => {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    },
    signUpWithEmail: async (email, password) => {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
    },
    resetPassword: async (email) => {
      await sendPasswordResetEmail(firebaseAuth, email);
    },
    logout: async () => {
      await signOut(firebaseAuth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
