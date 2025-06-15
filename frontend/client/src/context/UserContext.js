// src/context/UserContext.js - Fixed version
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

  // Debug logging function
  const logUserState = () => {
    console.log("UserContext - Current user:", currentUser);
    console.log("UserContext - UserId:", userId);
    console.log("UserContext - Loading:", loading);
    console.log("UserContext - IsAuthenticated:", isAuthenticated);
    console.log("UserContext - IsReady:", isReady);
  };

  // Sync Firebase user with MongoDB backend
  const syncFirebaseUserWithMongoDB = async (firebaseUser) => {
    try {
      console.log(
        "Firebase user detected, creating/finding MongoDB user:",
        firebaseUser?.uid
      );

      if (!firebaseUser) {
        console.error("No Firebase user provided to sync function");
        return null;
      }

      // Prepare user data for backend - handle potential undefined values
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

      console.log("Sending user data to backend:", userData);

      // Call backend to find or create MongoDB user
      const response = await authAPI.findOrCreateFirebaseUser(userData);

      console.log("Backend response:", response);

      if (response.success && response.user) {
        setCurrentUser(response.user);
        setUserId(response.user._id || response.user.id);
        setIsAuthenticated(true);
        return response.user;
      } else {
        console.error("Backend response indicates failure:", response);
        throw new Error(response.message || "Failed to sync user with backend");
      }
    } catch (error) {
      console.error("Error syncing Firebase user with MongoDB:", error);

      // More detailed error logging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      }

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
        console.log("Firebase user detected:", {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified,
        });

        // Wait a moment for Firebase to fully initialize
        await new Promise((resolve) => setTimeout(resolve, 100));

        const mongoUser = await syncFirebaseUserWithMongoDB(firebaseUser);

        if (mongoUser) {
          console.log("✅ MongoDB user synced successfully:", mongoUser);
        } else {
          console.error("❌ Failed to sync MongoDB user");
        }
      } else {
        console.log("No Firebase user - clearing user state");
        setCurrentUser(null);
        setUserId(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error in handleAuthState:", error);
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
    logUserState();

    // Don't process if Firebase auth is still loading
    if (authLoading) {
      console.log("Firebase auth still loading, waiting...");
      return;
    }

    console.log(
      "Processing Firebase auth state change:",
      firebaseUser?.uid || "No user"
    );
    handleAuthState(firebaseUser);
  }, [firebaseUser, authLoading]);

  // Log state changes for debugging
  useEffect(() => {
    logUserState();
  }, [currentUser, userId, loading, isAuthenticated, isReady]);

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
        console.warn("Backend logout failed (non-critical):", error);
      }

      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
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
      console.error("Error updating user:", error);
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
