import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient<Database> = supabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : (new Proxy({} as SupabaseClient<Database>, {
      get(_, prop) {
        if (prop === "auth") {
          return {
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            signUp: () => Promise.resolve({ data: {}, error: new Error("Supabase not configured") }),
            signInWithPassword: () => Promise.resolve({ data: {}, error: new Error("Supabase not configured") }),
            signOut: () => Promise.resolve({ error: null }),
            resetPasswordForEmail: () => Promise.resolve({ error: new Error("Supabase not configured") }),
          };
        }
        if (prop === "from") {
          return () => ({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }) }) }),
          });
        }
        return () => {};
      },
    }));
