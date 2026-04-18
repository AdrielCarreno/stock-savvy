import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Company, UserProfile } from "@/types/database";

type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  company: Company | null;
  loading: boolean;
  isTrialExpired: boolean;
};

type AuthContextValue = AuthState & {
  signUp: (
    email: string,
    password: string,
    companyName: string
  ) => Promise<{ error: Error | null; data?: { user: unknown | null; session: unknown | null } | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshCompany: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function computeTrialExpired(company: Company | null): boolean {
  if (!company) return false;
  if (company.subscription_status !== "trial") return false;
  return new Date(company.trial_end) < new Date();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const isTrialExpired = computeTrialExpired(company);

  const fetchProfileAndCompany = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await (supabase as any)
        .from("users")
        .select("*, companies(*)")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        setProfile(null);
        setCompany(null);
        return;
      }

      const companyRow = (profileData as { companies: Company | null }).companies ?? null;
      const { companies: _, ...profileRow } = profileData as UserProfile & { companies: Company | null };
      setProfile(profileRow as UserProfile);
      setCompany(companyRow);
    } catch {
      setProfile(null);
      setCompany(null);
    }
  }, []);

  const refreshCompany = useCallback(async () => {
    if (!user?.id) return;
    await fetchProfileAndCompany(user.id);
  }, [user?.id, fetchProfileAndCompany]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        await fetchProfileAndCompany(session.user.id);
      } else {
        setProfile(null);
        setCompany(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchProfileAndCompany(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileAndCompany]);

  const signUp = useCallback(
    async (email: string, password: string, companyName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { company_name: companyName.trim() || "Mi Empresa" },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error: error ?? null, data };
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCompany(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    return { error: error ?? null };
  }, []);

  const value: AuthContextValue = {
    user,
    profile,
    company,
    loading,
    isTrialExpired,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
