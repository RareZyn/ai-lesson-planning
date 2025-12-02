// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { auth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "../firebase";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set Firebase persistence to LOCAL by default (remember user across sessions)
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("Error setting Firebase persistence:", error);
    });

    // Listen to Firebase auth state changes only
    // UserContext will handle MongoDB sync to avoid duplication
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
