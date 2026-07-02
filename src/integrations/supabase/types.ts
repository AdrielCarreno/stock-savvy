export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_type: string
          subscription_status: string
          trial_end: string
          trial_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_type?: string
          subscription_status?: string
          trial_end?: string
          trial_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_type?: string
          subscription_status?: string
          trial_end?: string
          trial_start?: string
        }
        Relationships: []
      }
      customs_checklist: {
        Row: {
          checked: boolean
          company_id: string
          created_at: string
          customs_id: string
          id: string
          item: string
        }
        Insert: {
          checked?: boolean
          company_id: string
          created_at?: string
          customs_id: string
          id?: string
          item: string
        }
        Update: {
          checked?: boolean
          company_id?: string
          created_at?: string
          customs_id?: string
          id?: string
          item?: string
        }
        Relationships: [
          {
            foreignKeyName: "customs_checklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customs_checklist_customs_id_fkey"
            columns: ["customs_id"]
            isOneToOne: false
            referencedRelation: "customs_declarations"
            referencedColumns: ["id"]
          },
        ]
      }
      customs_declarations: {
        Row: {
          broker: string | null
          cif_value_usd: number | null
          company_id: string
          created_at: string
          declaration_date: string | null
          declaration_number: string | null
          duties_amount: number | null
          id: string
          import_id: string | null
          notes: string | null
          status: string
          tariff_position: string | null
          taxes_amount: number | null
          updated_at: string
        }
        Insert: {
          broker?: string | null
          cif_value_usd?: number | null
          company_id: string
          created_at?: string
          declaration_date?: string | null
          declaration_number?: string | null
          duties_amount?: number | null
          id?: string
          import_id?: string | null
          notes?: string | null
          status?: string
          tariff_position?: string | null
          taxes_amount?: number | null
          updated_at?: string
        }
        Update: {
          broker?: string | null
          cif_value_usd?: number | null
          company_id?: string
          created_at?: string
          declaration_date?: string | null
          declaration_number?: string | null
          duties_amount?: number | null
          id?: string
          import_id?: string | null
          notes?: string | null
          status?: string
          tariff_position?: string | null
          taxes_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customs_declarations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customs_declarations_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      imports: {
        Row: {
          code: string
          company_id: string
          created_at: string
          estimated_arrival: string | null
          exchange_rate: number | null
          fob_usd: number | null
          freight_usd: number | null
          id: string
          insurance_usd: number | null
          notes: string | null
          origin_country: string | null
          stage: string
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          estimated_arrival?: string | null
          exchange_rate?: number | null
          fob_usd?: number | null
          freight_usd?: number | null
          id?: string
          insurance_usd?: number | null
          notes?: string | null
          origin_country?: string | null
          stage?: string
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          estimated_arrival?: string | null
          exchange_rate?: number | null
          fob_usd?: number | null
          freight_usd?: number | null
          id?: string
          insurance_usd?: number | null
          notes?: string | null
          origin_country?: string | null
          stage?: string
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imports_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_documents: {
        Row: {
          company_id: string
          created_at: string
          doc_type: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          notes: string | null
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          doc_type: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          doc_type?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          notes?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_stock: {
        Row: {
          company_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_stock_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          client: string | null
          company_id: string
          cost: number | null
          created_at: string
          current_stock: number
          description: string | null
          id: string
          min_stock: number
          name: string
          price: number | null
          price_retail: number | null
          price_wholesale: number | null
          sku: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          client?: string | null
          company_id: string
          cost?: number | null
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          min_stock?: number
          name: string
          price?: number | null
          price_retail?: number | null
          price_wholesale?: number | null
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          client?: string | null
          company_id?: string
          cost?: number | null
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          min_stock?: number
          name?: string
          price?: number | null
          price_retail?: number | null
          price_wholesale?: number | null
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          bl_number: string | null
          carrier: string | null
          company_id: string
          container_number: string | null
          created_at: string
          eta: string | null
          etd: string | null
          id: string
          import_id: string | null
          notes: string | null
          status: string
          tracking_number: string | null
          transport_mode: string
          updated_at: string
        }
        Insert: {
          bl_number?: string | null
          carrier?: string | null
          company_id: string
          container_number?: string | null
          created_at?: string
          eta?: string | null
          etd?: string | null
          id?: string
          import_id?: string | null
          notes?: string | null
          status?: string
          tracking_number?: string | null
          transport_mode?: string
          updated_at?: string
        }
        Update: {
          bl_number?: string | null
          carrier?: string | null
          company_id?: string
          container_number?: string | null
          created_at?: string
          eta?: string | null
          etd?: string | null
          id?: string
          import_id?: string | null
          notes?: string | null
          status?: string
          tracking_number?: string | null
          transport_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          company_id: string
          created_at: string
          id: string
          logistics: string | null
          movement_date: string
          product_id: string
          quantity: number
          reason: string | null
          sale_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          logistics?: string | null
          movement_date?: string
          product_id: string
          quantity: number
          reason?: string | null
          sale_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          logistics?: string | null
          movement_date?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          sale_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          company_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          rating: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          company_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          rating?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          rating?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          role: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          id: string
          role?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_company_is_active: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
