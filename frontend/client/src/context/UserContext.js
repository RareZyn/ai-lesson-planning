// src/context/UserContext.js - Clean version without console logs
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { authAPI } from "../services/api";

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

  const { user: firebaseUser, loading: authLoading } = useAuth();

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
        setCurrentUser(response.user);
        setUserId(response.user._id || response.user.id);
        setIsAuthenticated(true);
        return response.user;
      } else {
        throw new Error(response.message || "Failed to sync user with backend");
      }
    } catch (error) {
      // Reset user state on error
      setCurrentUser(null);
      setUserId(null);
      setIsAuthenticated(false);
      return null;
    }
  };

  // Handle Firebase auth state changes
  const handleAuthState = async (firebaseUser) => {
    setLoading(true);

    try {
      if (firebaseUser) {
        // Wait a moment for Firebase to fully initialize
        await new Promise((resolve) => setTimeout(resolve, 100));
        await syncFirebaseUserWithMongoDB(firebaseUser);
      } else {
        setCurrentUser(null);
        setUserId(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setCurrentUser(null);
      setUserId(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      setIsReady(true);
    }
  };

  // Effect to handle Firebase auth state changes
  useEffect(() => {
    // Don't process if Firebase auth is still loading
    if (authLoading) {
      return;
    }

    handleAuthState(firebaseUser);
  }, [firebaseUser, authLoading]);

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);

      // Clear local state first
      setCurrentUser(null);
      setUserId(null);
      setIsAuthenticated(false);

      // Call backend logout (optional, mainly for cookie clearing)
      try {
        await authAPI.logout();
      } catch (error) {
        // Ignore backend logout errors
      }
    } catch (error) {
      // Ignore logout errors
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
        setCurrentUser(response.user);
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
    refreshUser: () => handleAuthState(firebaseUser),
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
