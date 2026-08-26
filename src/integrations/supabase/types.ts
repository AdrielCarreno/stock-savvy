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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          code: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          company_id: string
          created_at: string
          detail: Json | null
          entity: string | null
          entity_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          detail?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          detail?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
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
      customers: {
        Row: {
          address: string | null
          balance: number
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          balance?: number
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          balance?: number
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      journal_entries: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          entry_number: number
          id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          entry_date?: string
          entry_number?: number
          id?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          entry_number?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          company_id: string
          created_at: string
          credit: number
          debit: number
          entry_id: string
          id: string
        }
        Insert: {
          account_id: string
          company_id: string
          created_at?: string
          credit?: number
          debit?: number
          entry_id: string
          id?: string
        }
        Update: {
          account_id?: string
          company_id?: string
          created_at?: string
          credit?: number
          debit?: number
          entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
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
      purchase_items: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          product_id: string | null
          purchase_id: string
          quantity: number
          subtotal: number
          unit_cost: number
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string | null
          purchase_id: string
          quantity?: number
          subtotal?: number
          unit_cost?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string | null
          purchase_id?: string
          quantity?: number
          subtotal?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_date: string
          received_date: string | null
          reference: string | null
          status: string
          supplier_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          received_date?: string | null
          reference?: string | null
          status?: string
          supplier_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          received_date?: string | null
          reference?: string | null
          status?: string
          supplier_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          product_id: string | null
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          sale_id: string
          subtotal?: number
          unit_price?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          channel: string | null
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount: number
          id: string
          invoice_number: string | null
          invoice_url: string | null
          logistics: string | null
          notes: string | null
          payment_method: string | null
          reference: string | null
          sale_date: string
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          channel?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          logistics?: string | null
          notes?: string | null
          payment_method?: string | null
          reference?: string | null
          sale_date?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          channel?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          logistics?: string | null
          notes?: string | null
          payment_method?: string | null
          reference?: string | null
          sale_date?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
      supplier_products: {
        Row: {
          company_id: string
          created_at: string
          product_id: string
          supplier_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          product_id: string
          supplier_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          product_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
      user_roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
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
      current_company_id: { Args: never; Returns: string }
      current_company_is_active: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      account_type: "activo" | "pasivo" | "patrimonio" | "ingreso" | "gasto"
      app_role: "admin" | "manager" | "staff" | "viewer"
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
    Enums: {
      account_type: ["activo", "pasivo", "patrimonio", "ingreso", "gasto"],
      app_role: ["admin", "manager", "staff", "viewer"],
    },
  },
} as const
