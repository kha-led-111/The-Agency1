"use client";

import { useState, useEffect } from "react";

export type UserRole = "مشتري" | "بائع" | "مسؤول";

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
  const [role, setRole] = useState<UserRole>("مشتري");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
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
  }, []);

  const isAdmin = role === "مسؤول";

  const changeRole = (newRole: UserRole) => {
    setStoredRole(newRole);
    setRole(newRole);
  };

  return { role, isAdmin, isLoaded, changeRole };
}
