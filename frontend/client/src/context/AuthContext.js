// src/context/AuthContext.js 
import { createContext, useContext, useState, useEffect } from "react";
import { auth, onAuthStateChanged } from "../firebase";
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
        try {
          if (user) {
            // Firebase user exists - sync with MongoDB
            try {
              const response = await authAPI.findOrCreateFirebaseUser({
                firebaseUid: user.uid,
                email: user.email,
                name: user.displayName || user.email?.split("@")[0] || "User",
                displayName: user.displayName || "",
                photoURL: user.photoURL || "",
              });

              if (response.success && response.user) {
                setCurrentUser({
                  ...response.user,
                  uid: user.uid, // Keep Firebase UID for reference
                });
              } else {
                setCurrentUser(null);
              }
            } catch (error) {
              console.error("Error syncing with MongoDB:", error);
              // Set basic Firebase user if MongoDB sync fails
              setCurrentUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              });
            }
          } else {
            // User is signed out
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Error handling auth state:", error);
          setCurrentUser(null);
        } finally {
          setLoading(false);
        }
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
