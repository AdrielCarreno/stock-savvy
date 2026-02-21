export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          plan_type: string;
          trial_start: string;
          trial_end: string;
          subscription_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan_type?: string;
          trial_start?: string;
          trial_end?: string;
          subscription_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          plan_type?: string;
          trial_start?: string;
          trial_end?: string;
          subscription_status?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          email: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          email?: string;
          role?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
