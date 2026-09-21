"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setAccessToken, fetchWithAuth } from "@/lib/api";

export type UserRole = "مشتري" | "بائع" | "مندوب" | "مسؤول" | "Admin" | "Seller" | "Buyer" | "Courier";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  isEmailVerified?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCourier: boolean;
  isLoading: boolean;
  role: UserRole;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const userData: AuthUser = await res.json();
        setUser(userData);
        if (userData.role) {
          localStorage.setItem("user_role", userData.role);
        }
      } else {
        setUser(null);
        setAccessToken(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const userData: AuthUser = data.user;
        setUser(userData);
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }
        if (userData?.role) {
          localStorage.setItem("user_role", userData.role);
        }
        window.dispatchEvent(new Event("role-change"));
        return { success: true, user: userData };
      } else {
        const errData = await res.json().catch(() => ({ message: "فشل تسجيل الدخول" }));
        return { success: false, error: errData.message || "اسم المستخدم أو كلمة المرور غير صحيحة" };
      }
    } catch {
      return { success: false, error: "تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
    } catch (e) {
      console.error("Logout request failed", e);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem("user_role");
      window.dispatchEvent(new Event("role-change"));
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "Admin" || user?.role === "مسؤول";
  const isCourier = user?.role === "Courier" || user?.role === "مندوب";
  
  const role: UserRole = isAdmin
    ? "مسؤول"
    : isCourier
    ? "مندوب"
    : user?.role === "Seller" || user?.role === "بائع"
    ? "بائع"
    : "مشتري";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isCourier,
        isLoading,
        role,
        refreshUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Backward compatibility helpers
export function getStoredRole(): UserRole {
  if (typeof window === "undefined") return "مشتري";
  const stored = localStorage.getItem("user_role");
  if (stored === "مسؤول" || stored === "Admin" || stored === "admin") return "مسؤول";
  if (stored === "بائع" || stored === "Seller" || stored === "seller") return "بائع";
  return "مشتري";
}

export function setStoredRole(role: UserRole) {
  if (typeof window === "undefined") return;
  localStorage.setItem("user_role", role);
  window.dispatchEvent(new Event("role-change"));
}

export function useAuthRole() {
  const context = useContext(AuthContext);
  const [role, setRole] = useState<UserRole>("مشتري");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (context) return;

    setRole(getStoredRole());
    setIsLoaded(true);

    const handleRoleChange = () => {
      setRole(getStoredRole());
    };

    window.addEventListener("role-change", handleRoleChange);
    window.addEventListener("storage", handleRoleChange);

    return () => {
      window.removeEventListener("role-change", handleRoleChange);
      window.removeEventListener("storage", handleRoleChange);
    };
  }, [context]);

  if (context) {
    return {
      role: context.role,
      isAdmin: context.isAdmin,
      isLoaded: !context.isLoading,
      changeRole: (newRole: UserRole) => setStoredRole(newRole),
    };
  }

  const isAdmin = role === "مسؤول";

  const changeRole = (newRole: UserRole) => {
    setStoredRole(newRole);
    setRole(newRole);
  };

  return { role, isAdmin, isLoaded, changeRole };
}
