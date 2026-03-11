import React, { createContext, useContext, useState, useCallback } from "react";

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
    // Mock authentication
    if (!email || !password) throw new Error("Preencha todos os campos");
    const mockToken = btoa(`${email}:${Date.now()}`);
    const mockUser = { email, username: email.split("@")[0] };
    localStorage.setItem("submarine_token", mockToken);
    localStorage.setItem("submarine_user", JSON.stringify(mockUser));
    setToken(mockToken);
    setUser(mockUser);
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
