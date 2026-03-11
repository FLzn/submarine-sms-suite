import React, { createContext, useContext, useState, useCallback } from "react";
import { apiLogin } from "@/lib/api";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: { email: string; username: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("submarine_token"));
  const [user, setUser] = useState<{ email: string; username: string } | null>(() => {
    const stored = localStorage.getItem("submarine_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    if (!email || !password) throw new Error("Preencha todos os campos");
    const { access_token } = await apiLogin(email, password);
    let userData: { email: string; username: string };
    try {
      const payload = JSON.parse(atob(access_token.split(".")[1]));
      userData = { email: payload.email || email, username: payload.username || email.split("@")[0] };
    } catch {
      userData = { email, username: email.split("@")[0] };
    }
    localStorage.setItem("submarine_token", access_token);
    localStorage.setItem("submarine_user", JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("submarine_token");
    localStorage.removeItem("submarine_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
