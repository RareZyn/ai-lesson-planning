// src/context/UserContext.js - Fixed with better error handling and authentication flow
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get Firebase user from AuthContext
  const { currentUser: firebaseUser, loading: authLoading } = useAuth();

  // Wrap loadUser in useCallback to avoid infinite re-renders
  const loadUser = useCallback(async () => {
    // Don't load user if auth is still loading
    if (authLoading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");

      // If no token and no Firebase user, user is not authenticated
      if (!token && !firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // If we have a token, try to get user from backend
      if (token) {
        try {
          const response = await authAPI.getMe();
          if (response.success) {
            console.log("Backend user loaded:", response.user);
            setUser(response.user);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Backend auth failed:", error);
          // If backend auth fails, remove token and fall back to Firebase
          localStorage.removeItem("authToken");
        }
      }

      // Handle Firebase user - create/find MongoDB user
      if (firebaseUser) {
        try {
          console.log(
            "Firebase user detected, creating/finding MongoDB user:",
            firebaseUser.uid
          );

          const response = await authAPI.findOrCreateFirebaseUser({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });

          if (response.success) {
            console.log("MongoDB user created/found:", response.user);
            setUser(response.user);
          } else {
            throw new Error("Failed to create/find MongoDB user");
          }
        } catch (error) {
          console.error("Error creating/finding MongoDB user:", error);
          // Fallback to Firebase user data
          setUser({
            _id: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            roles: ["teacher"],
            firebaseUid: firebaseUser.uid,
          });
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setError("Failed to load user data");
      // Don't set user to null here - let the user stay logged in with Firebase data
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, authLoading]); // Add authLoading as dependency

  // Load user data when auth loading completes or when firebase user changes
  useEffect(() => {
    if (!authLoading) {
      loadUser();
    }
  }, [loadUser, authLoading]); // Add authLoading dependency

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authAPI.login(credentials);

      if (response.success) {
        setUser(response.user);
        localStorage.setItem("authToken", response.token);
        return response;
      }
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout if we have a token
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error("Backend logout error:", error);
          // Continue with logout even if backend call fails
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state and storage
      setUser(null);
      setError(null);
      localStorage.removeItem("authToken");

      // Force reload to ensure clean state
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // Determine if user is authenticated (either backend or Firebase)
  const isAuthenticated = !!(user && !loading);

  // Get the MongoDB ObjectId (_id) which is what the backend expects
  const userId = user?._id || user?.id;

  // Debug logging (remove in production)
  console.log("UserContext - Current user:", user);
  console.log("UserContext - UserId:", userId);
  console.log("UserContext - Loading:", loading);
  console.log("UserContext - IsAuthenticated:", isAuthenticated);

  const value = {
    user,
    loading: loading || authLoading, // Include auth loading
    error,
    loadUser,
    login,
    logout,
    updateUser,
    isAuthenticated,
    userId,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
