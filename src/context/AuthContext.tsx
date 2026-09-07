import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ApiError,
  fetchSession,
  loginRequest,
  logoutRequest,
  registerRequest,
  resendVerificationRequest,
  updateProfileRequest,
} from "../lib/api";
import type { Member, ProfilePayload, RegisterPayload } from "../lib/types";

interface AuthContextValue {
  member: Member | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Member>;
  register: (payload: RegisterPayload) => Promise<Member>;
  logout: () => Promise<void>;
  updateProfile: (payload: ProfilePayload) => Promise<Member>;
  refresh: () => Promise<Member | null>;
  resendVerification: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchSession()
      .then((data) => {
        if (active) setMember(data.member);
      })
      .catch(() => {
        if (active) setMember(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      member,
      loading,
      async login(email, password) {
        const data = await loginRequest(email, password);
        setMember(data.member);
        return data.member;
      },
      async register(payload) {
        const data = await registerRequest(payload);
        setMember(data.member);
        return data.member;
      },
      async logout() {
        try {
          await logoutRequest();
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 0) {
            setMember(null);
            throw error;
          }
        }
        setMember(null);
      },
      async updateProfile(payload) {
        const data = await updateProfileRequest(payload);
        setMember(data.member);
        return data.member;
      },
      async refresh() {
        const data = await fetchSession();
        setMember(data.member);
        return data.member;
      },
      async resendVerification() {
        const data = await resendVerificationRequest();
        return data.message;
      },
    }),
    [member, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
