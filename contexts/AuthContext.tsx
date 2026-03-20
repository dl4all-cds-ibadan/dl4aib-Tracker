"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

import { authenticateUser } from "@/lib/actions";
import { User } from "@/lib/types";

interface AuthContextType {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  user: User | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  isSuperAdmin: false,
  user: null,
  initialized: false,
  login: async () => ({ success: false }),
  logout: () => {},
});

const AUTH_KEY = "dl4aib_user_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed?.id) setUser(parsed);
      }
    } catch {}
    setInitialized(true);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const res = await authenticateUser(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem(AUTH_KEY, JSON.stringify(res.user));
      return { success: true };
    }
    return { success: false, error: res.error || "Login failed" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ 
      isAdmin: user !== null, 
      isSuperAdmin: user?.role === "SUPERADMIN", 
      user, 
      initialized, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
