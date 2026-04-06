import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const AUTH_STORAGE_KEY = "birdnet-auth-user";

export const TEST_USERNAME = "team-07";
export const TEST_PASSWORD = "team@07";

type AuthContextValue = {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getInitialUser(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(getInitialUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(username),
      username,
      login: (candidateUsername: string, candidatePassword: string) => {
        const normalized = candidateUsername.trim().toLowerCase();
        const valid = normalized === TEST_USERNAME && candidatePassword === TEST_PASSWORD;

        if (!valid) return false;

        setUsername(TEST_USERNAME);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(AUTH_STORAGE_KEY, TEST_USERNAME);
        }
        return true;
      },
      logout: () => {
        setUsername(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      },
    }),
    [username],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
