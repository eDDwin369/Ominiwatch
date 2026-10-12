import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "./types";
import { DEMO_ACCOUNTS } from "./demo-accounts";
import { getSessionEmail, getSessionRole } from "../../utils/navigation";

interface AuthCtx {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const STORAGE_KEY = "oomni_auth_user_session";

/**
 * When embedded in the host Base-application there is no separate help sign-in:
 * the shell's session (email + role) is the identity the help feature runs as.
 */
function userFromHostSession(): User | null {
  const email = getSessionEmail();
  if (!email) return null;
  return {
    id: `host-${email}`,
    email,
    name: email.split("@")[0],
    role: getSessionRole(),
    tenantId: "tenant-omnieye",
    avatarColor: COLORS[email.length % COLORS.length],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as User) : userFromHostSession();
    } catch {
      return userFromHostSession();
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login: AuthCtx["login"] = async (email, password) => {
    const demo = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    const newUser: User = {
      id: demo ? `user-${demo.email}` : `user-${Date.now()}`,
      email: email.trim(),
      name: demo ? demo.name : email.split("@")[0],
      role: demo ? demo.role : "customer",
      tenantId: "tenant-omnieye",
      avatarColor: COLORS[email.length % COLORS.length],
    };
    setUser(newUser);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch {}
    return { ok: true };
  };

  const signUp: AuthCtx["signUp"] = async (email, password, fullName) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: email.trim(),
      name: fullName,
      role: "customer",
      tenantId: "tenant-omnieye",
      avatarColor: COLORS[email.length % COLORS.length],
    };
    setUser(newUser);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch {}
    return { ok: true };
  };

  const logout = async () => {
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <Ctx.Provider value={{ user, isLoading, login, signUp, logout }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
