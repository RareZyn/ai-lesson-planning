// src/context/AuthContext.js - Updated to work with UserContext
import { createContext, useContext, useState, useEffect } from "react";
import { auth, onAuthStateChanged } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { authAPI } from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token first
    const checkExistingAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const response = await authAPI.getMe();
          if (response.success) {
            setCurrentUser(response.user);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Token validation failed:", error);
          localStorage.removeItem("authToken");
        }
      }

      // If no valid token, check Firebase auth
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
              setCurrentUser({
                uid: user.uid,
                email: user.email,
                ...userDoc.data(),
              });
            } else {
              // Create new user document if it doesn't exist
              await setDoc(userRef, {
                email: user.email,
                createdAt: serverTimestamp(),
                roles: ["teacher"], // Default role
                lastLogin: serverTimestamp(),
              });

              setCurrentUser({
                uid: user.uid,
                email: user.email,
                roles: ["teacher"],
              });
            }
          } catch (error) {
            console.error("Error handling user document:", error);
            // Fallback to basic user info
            setCurrentUser({
              uid: user.uid,
              email: user.email,
            });
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    checkExistingAuth();
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
