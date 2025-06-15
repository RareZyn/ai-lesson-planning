// src/context/UserContext.js - Fixed version with proper loading states
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { authAPI } from "../services/api";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncing, setSyncing] = useState(false); // New state for sync process

  // Sync Firebase user with MongoDB
  const syncFirebaseUserWithMongoDB = async (firebaseUser) => {
    if (!firebaseUser || syncing) {
      return null;
    }

    setSyncing(true);
    console.log(
      "Firebase user detected, creating/finding MongoDB user:",
      firebaseUser.uid
    );

    try {
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      };

      const response = await authAPI.findOrCreateFirebaseUser(userData);

      if (response.success) {
        console.log("MongoDB user created/found:", response.user);
        setUser(response.user);
        setIsAuthenticated(true);
        return response.user;
      } else {
        console.error(
          "Failed to sync Firebase user with MongoDB:",
          response.message
        );
        return null;
      }
    } catch (error) {
      console.error("Error syncing Firebase user with MongoDB:", error);
      return null;
    } finally {
      setSyncing(false);
    }
  };

  // Main effect to handle authentication state
  useEffect(() => {
    let isMounted = true;

    const handleAuthState = async () => {
      // Wait for auth loading to complete
      if (authLoading) {
        return;
      }

      if (currentUser) {
        // Firebase user exists, sync with MongoDB
        const mongoUser = await syncFirebaseUserWithMongoDB(currentUser);

        if (isMounted) {
          if (mongoUser) {
            setUser(mongoUser);
            setIsAuthenticated(true);
          } else {
            // Sync failed, clear state
            setUser(null);
            setIsAuthenticated(false);
          }
          setLoading(false);
        }
      } else {
        // No Firebase user, clear everything
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    };

    handleAuthState();

    return () => {
      isMounted = false;
    };
  }, [currentUser, authLoading]);

  // Update profile function
  const updateUserProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      if (response.success) {
        setUser(response.user);
        return response;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Helper function to get user ID (prioritize MongoDB _id)
  const getUserId = () => {
    if (user?._id) return user._id;
    if (user?.id) return user.id;
    if (currentUser?.uid) return currentUser.uid;
    return null;
  };

  const value = {
    user,
    userId: getUserId(),
    loading: loading || authLoading || syncing, // Include syncing in loading state
    isAuthenticated,
    updateUserProfile,
    logout,
    // Additional helper
    isReady: !loading && !authLoading && !syncing, // New flag for when everything is ready
  };

  // Debug logging
  console.log("UserContext - Current user:", user);
  console.log("UserContext - UserId:", getUserId());
  console.log("UserContext - Loading:", loading || authLoading || syncing);
  console.log("UserContext - IsAuthenticated:", isAuthenticated);
  console.log("UserContext - IsReady:", !loading && !authLoading && !syncing);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
