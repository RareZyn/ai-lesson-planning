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

  const { currentUser: firebaseUser, loading: authLoading } = useAuth();

  const setAuthenticatedState = (user) => {
    setCurrentUser(user);
    setUserId(user._id || user.id);
    setIsAuthenticated(true);
  };

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
  }, [clearAuthenticatedState]);

  // Centralized function to handle Firebase user login and backend sync
  const handleFirebaseLogin = useCallback(
    async (user) => {
      if (!user) {
        clearAuthenticatedState();
        return null;
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
          setAuthenticatedState(response.user);
          return response.user; // Return the backend user profile
        } else {
          throw new Error(response.message || "Backend sync failed");
        }
      } catch (error) {
        console.error("Error during handleFirebaseLogin:", error);
        await signOut(auth); // Sign out of Firebase if backend fails
        clearAuthenticatedState();
        return null; // Indicate failure
      } finally {
        setLoading(false);
      }
    },
    [clearAuthenticatedState]
  );

  useEffect(() => {
    if (authLoading) {
      return; // Wait until Firebase auth is initialized
    }

    const initializeAuth = async () => {
      setLoading(true);
      // If a Firebase user object exists and our context isn't authenticated yet,
      // this is the primary path for login (Google, email, page refresh).
      if (firebaseUser && !isAuthenticated) {
        await handleFirebaseLogin(firebaseUser);
      }
      // If no Firebase user, check for a lingering JWT as a fallback.
      else if (!firebaseUser) {
        await checkExistingAuth();
      }
      setLoading(false);
      setIsReady(true);
    };

    initializeAuth();
  }, [
    firebaseUser,
    authLoading,
    isAuthenticated,
    handleFirebaseLogin,
    checkExistingAuth,
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

  const contextValue = {
    currentUser,
    userId,
    loading,
    isAuthenticated,
    isReady,
    firebaseUser,
    logout,
    updateUser,
    handleFirebaseLogin, // Expose the new centralized function
    refreshUser: checkExistingAuth,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};