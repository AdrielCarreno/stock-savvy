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
      products: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          sku: string | null;
          description: string | null;
          category: string | null;
          client: string | null;
          unit: string;
          current_stock: number;
          min_stock: number;
          price: number | null;
          cost: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          sku?: string | null;
          description?: string | null;
          category?: string | null;
          client?: string | null;
          unit?: string;
          current_stock?: number;
          min_stock?: number;
          price?: number | null;
          cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          sku?: string | null;
          description?: string | null;
          category?: string | null;
          client?: string | null;
          unit?: string;
          current_stock?: number;
          min_stock?: number;
          price?: number | null;
          cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stock_movements: {
        Row: {
          id: string;
          company_id: string;
          product_id: string;
          user_id: string;
          type: string;
          quantity: number;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          product_id: string;
          user_id: string;
          type: string;
          quantity: number;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          product_id?: string;
          user_id?: string;
          type?: string;
          quantity?: number;
          reason?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type StockMovement = Database["public"]["Tables"]["stock_movements"]["Row"];
