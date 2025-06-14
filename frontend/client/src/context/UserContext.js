// src/context/UserContext.js - Simplified version that works with AuthContext
import React, { createContext, useContext, useState, useEffect } from "react";
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
  const { currentUser: firebaseUser } = useAuth();

  // Load user data on component mount or when firebase user changes
  useEffect(() => {
    loadUser();
  }, [firebaseUser]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
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

      // Fallback to Firebase user if available
      if (firebaseUser) {
        setUser({
          _id: firebaseUser.uid,
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email,
          roles: ["teacher"],
          ...firebaseUser,
        });
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setError("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

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
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("authToken");
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // Determine if user is authenticated (either backend or Firebase)
  const isAuthenticated = !!(user || firebaseUser);
  const userId = user?._id || user?.id || firebaseUser?.uid;

  const value = {
    user: user || firebaseUser,
    loading,
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
