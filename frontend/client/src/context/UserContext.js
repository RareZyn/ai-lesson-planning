// src/context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
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

  // Helper function to set authenticated state
  const setAuthenticatedState = (user) => {
    setCurrentUser(user);
    setUserId(user._id || user.id);
    setIsAuthenticated(true);
  };

  // Helper function to clear authenticated state
  const clearAuthenticatedState = () => {
    setCurrentUser(null);
    setUserId(null);
    setIsAuthenticated(false);
    localStorage.removeItem("authToken");
  };

  // Sync Firebase user with MongoDB backend
  const syncFirebaseUserWithMongoDB = async (firebaseUser) => {
    try {
      if (!firebaseUser) {
        return null;
      }

      // Prepare user data for backend
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email || "",
        name:
          firebaseUser.displayName ||
          firebaseUser.email?.split("@")[0] ||
          "User",
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
      };

      // Call backend to find or create MongoDB user
      const response = await authAPI.findOrCreateFirebaseUser(userData);

      if (response.success && response.user) {
        // Store the JWT token if provided
        if (response.token) {
          localStorage.setItem("authToken", response.token);
        }

        // Set authenticated state
        setAuthenticatedState(response.user);
        return response.user;
      } else {
        throw new Error(response.message || "Failed to sync user with backend");
      }
    } catch (error) {
      console.error("MongoDB sync error:", error);
      clearAuthenticatedState();
      return null;
    }
  };

  // Check for existing JWT token
  const checkExistingAuth = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        return false;
      }

      // Verify token with backend
      const response = await authAPI.getMe();

      if (response.success && response.user) {
        setAuthenticatedState(response.user);
        return true;
      } else {
        throw new Error("Invalid token response");
      }
    } catch (error) {
      // Clear invalid token
      localStorage.removeItem("authToken");
      clearAuthenticatedState();
      return false;
    }
  };

  // Main auth initialization function
  const initializeAuth = async () => {
    setLoading(true);

    try {
      // First, check if we have a Firebase user
      if (firebaseUser && firebaseUser.uid) {
        // If Firebase user exists, sync with MongoDB
        await syncFirebaseUserWithMongoDB(firebaseUser);
      } else {
        // No Firebase user, check for existing JWT token
        const hasExistingAuth = await checkExistingAuth();

        if (!hasExistingAuth) {
          clearAuthenticatedState();
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      clearAuthenticatedState();
    } finally {
      setLoading(false);
      setIsReady(true);
    }
  };

  // Effect to handle auth state changes
  useEffect(() => {
    // Wait for Firebase auth to finish loading
    if (authLoading) {
      return;
    }

    initializeAuth();
  }, [firebaseUser, authLoading]);

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);

      // Clear local state first
      clearAuthenticatedState();

      // Call backend logout (optional, mainly for cookie clearing)
      try {
        await authAPI.logout();
      } catch (error) {
        // Ignore backend logout errors
        console.error("Backend logout error:", error);
      }

      // Sign out from Firebase
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Firebase signout error:", error);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update user function
  const updateUser = async (updatedData) => {
    try {
      setLoading(true);
      const response = await authAPI.updateProfile(updatedData);

      if (response.success && response.user) {
        setAuthenticatedState(response.user);
        return response.user;
      } else {
        throw new Error(response.message || "Failed to update user");
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    // User state
    currentUser,
    userId,
    loading,
    isAuthenticated,
    isReady,

    // Firebase user for reference
    firebaseUser,

    // Functions
    logout,
    updateUser,
    syncFirebaseUserWithMongoDB,

    // Utility functions
    refreshUser: initializeAuth,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
