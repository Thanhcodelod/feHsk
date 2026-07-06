"use client";

import * as React from "react";
import {
  apiLogin,
  apiMe,
  apiRegister,
  type AuthUser,
} from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/token";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name?: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiMe();
        if (active) setUser(me);
      } catch {
        clearToken(); // stale / invalid token
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const { token, user } = await apiLogin({ email, password });
    setToken(token);
    setUser(user);
    window.dispatchEvent(new Event("hsk-progress-updated"));
  }, []);

  const register = React.useCallback(
    async (email: string, password: string, name?: string) => {
      const { token, user } = await apiRegister({ email, password, name });
      setToken(token);
      setUser(user);
      window.dispatchEvent(new Event("hsk-progress-updated"));
    },
    []
  );

  const logout = React.useCallback(() => {
    clearToken();
    setUser(null);
    window.dispatchEvent(new Event("hsk-progress-updated"));
  }, []);

  const value = React.useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
