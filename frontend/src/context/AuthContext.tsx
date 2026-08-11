import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../types/auth";
import * as authApi from "../api/auth";
import { ApiError } from "../api/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  connectionError: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then((currentUser) => setUser(currentUser))
      .catch((err) => {
        setUser(null);
        /**
         * ApiError means the request reached the server and got a real
         * answer (401 - not logged in), which is the normal signed-out
         * case. Anything else means fetch() itself failed - the backend
         * never responded at all - which is a different problem
         * (server unreachable) that components/ProtectedRoute.tsx needs
         * to tell apart from "please log in," so it doesn't send an
         * already-logged-in user back to the login screen just because
         * the backend happened to be down when they refreshed.
         */
        if (!(err instanceof ApiError)) {
          setConnectionError(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    setUser(await authApi.login(email, password));
  }

  async function signup(email: string, password: string) {
    setUser(await authApi.signup(email, password));
  }

  async function logout() {
    await authApi.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, connectionError, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- provider + hook living together is the standard context pattern; splitting into two files for one hook is unwarranted fragmentation.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
