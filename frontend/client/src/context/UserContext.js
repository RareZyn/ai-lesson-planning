// src/context/UserContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { authAPI } from "../services/api";
import { auth, signOut } from "../firebase";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [lastFirebaseUid, setLastFirebaseUid] = useState(null); // Track last processed Firebase UID

  const { currentUser: firebaseUser, loading: authLoading } = useAuth();

  const setAuthenticatedState = useCallback((user) => {
    setCurrentUser(user);
    setUserId(user._id || user.id);
    setIsAuthenticated(true);
  }, []);

  const clearAuthenticatedState = useCallback(() => {
    setCurrentUser(null);
    setUserId(null);
    setIsAuthenticated(false);
    localStorage.removeItem("authToken");
  }, []);

  const checkExistingAuth = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      clearAuthenticatedState();
      return false;
    }
    try {
      const response = await authAPI.getMe();
      if (response.success && response.user) {
        setAuthenticatedState(response.user);
        return true;
      }
      throw new Error("Invalid token");
    } catch (error) {
      clearAuthenticatedState();
      return false;
    }
  }, [clearAuthenticatedState, setAuthenticatedState]);

  // Centralized function to handle Firebase user login and backend sync
  const handleFirebaseLogin = useCallback(
    async (user) => {
      if (!user) {
        clearAuthenticatedState();
        return null; // Return null effectively
      }
      setLoading(true);
      try {
        const response = await authAPI.findOrCreateFirebaseUser({
          firebaseUid: user.uid,
          email: user.email,
          name: user.displayName || "",
          photoURL: user.photoURL || "",
        });

        if (response.success && response.user) {
          // KEY CHANGE: Only auto-login if schoolId is present
          if (response.user.schoolId) {
            setAuthenticatedState(response.user);
          } else {
            console.log("Partial registration detected. User needs to complete profile with token.");
            // Do NOT set authenticated state here.
            // LoginPage.jsx will handle the modal.
          }
          return response.user;
        } else {
          throw new Error(response.message || "Backend sync failed");
        }
      } catch (error) {
        console.error("Error during handleFirebaseLogin:", error);
        // Only sign out if it's a real backend failure, not just a partial profile
        // But for safety, if backend fails, we should clear state
        // await signOut(auth); // Commented out to allow LoginPage to handle flow? 
        // Actually, if backend sync fails completely, we should probably reset.
        // But for now, let's stick to clearing local state.
        clearAuthenticatedState();
        return null;
      } finally {
        setLoading(false);
      }
    },
    [clearAuthenticatedState, setAuthenticatedState]
  );

  useEffect(() => {
    if (authLoading) {
      return; // Wait until Firebase auth is initialized
    }

    const initializeAuth = async () => {
      const currentFirebaseUid = firebaseUser?.uid || null;

      // If a Firebase user object exists and we haven't processed this user yet
      if (firebaseUser && currentFirebaseUid && currentFirebaseUid !== lastFirebaseUid) {
        setLoading(true);
        setLastFirebaseUid(currentFirebaseUid); // Mark this UID as processed
        await handleFirebaseLogin(firebaseUser);
        setLoading(false);
        setIsReady(true);
      }
      // If no Firebase user and we had one before, clear auth
      else if (!firebaseUser && lastFirebaseUid) {
        setLoading(true);
        setLastFirebaseUid(null);
        clearAuthenticatedState();
        setLoading(false);
        setIsReady(true);
      }
      // Initial load with no Firebase user - check for JWT
      else if (!firebaseUser && !lastFirebaseUid && !isReady) {
        setLoading(true);
        await checkExistingAuth();
        setLoading(false);
        setIsReady(true);
      }
      // If already processed, just ensure we're ready
      else if (!isReady) {
        setLoading(false);
        setIsReady(true);
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    firebaseUser?.uid, // Only track UID changes, not the entire user object
    authLoading,
    // Do NOT add lastFirebaseUid or isReady to dependencies as they are set inside
  ]);

  const logout = async () => {
    setLoading(true);
    const localSignOut = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Firebase signout error:", error);
      }
    };
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Backend logout error (token may already be invalid):", error);
    } finally {
      clearAuthenticatedState();
      await localSignOut();
      setLoading(false);
    }
  };

  const updateUser = async (updatedData) => {
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(updatedData);
      if (response.success && response.user) {
        setAuthenticatedState(response.user);
        return response.user;
      }
      throw new Error(response.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  // Check if account is deactivated
  const isDeactivated = currentUser && currentUser.isActive === false;

  const contextValue = {
    currentUser,
    userId,
    loading,
    isAuthenticated,
    isReady,
    isDeactivated, // NEW: Track deactivated status
    firebaseUser,
    logout,
    updateUser,
    handleFirebaseLogin,
    refreshUser: checkExistingAuth,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};