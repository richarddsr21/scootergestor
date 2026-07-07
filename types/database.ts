export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          cnpj: string | null
          email: string | null
          phone: string | null
          whatsapp: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          logo_url: string | null
          plan: string
          status: string
          subscription_status: string | null
          trial_ends_at: string | null
          subscription_current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["companies"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>

        Relationships: never[]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          company_id: string
          name: string
          email: string
          phone: string | null
          role: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>

        Relationships: never[]
      }
      company_settings: {
        Row: {
          id: string
          company_id: string
          business_name: string | null
          legal_name: string | null
          cnpj: string | null
          phone: string | null
          whatsapp: string | null
          email: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          business_hours: string | null
          slogan: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          business_name?: string | null
          legal_name?: string | null
          cnpj?: string | null
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          business_hours?: string | null
          slogan?: string | null
          notes?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["company_settings"]["Insert"]>

        Relationships: never[]
      }
      company_theme_settings: {
        Row: {
          id: string
          company_id: string
          primary_color: string | null
          secondary_color: string | null
          logo_url: string | null
          favicon_url: string | null
          app_display_name: string | null
          theme_mode: string
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          primary_color?: string | null
          secondary_color?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          app_display_name?: string | null
          theme_mode?: string
        }
        Update: Partial<Database["public"]["Tables"]["company_theme_settings"]["Insert"]>

        Relationships: never[]
      }
      customers: {
        Row: {
          id: string
          company_id: string
          name: string
          phone: string | null
          whatsapp: string | null
          email: string | null
          cpf_cnpj: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>

        Relationships: never[]
      }
      product_categories: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          type: string
          display_order: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["product_categories"]["Row"], "id" | "created_at" | "updated_at" | "status"> & { status?: string }
        Update: Partial<Database["public"]["Tables"]["product_categories"]["Insert"]>

        Relationships: never[]
      }
      products: {
        Row: {
          id: string
          company_id: string
          category_id: string | null
          supplier_id: string | null
          name: string
          sku: string | null
          barcode: string | null
          brand: string | null
          model: string | null
          description: string | null
          cost_price: number
          sale_price: number
          stock_quantity: number
          minimum_stock: number
          unit: string
          image_url: string | null
          product_type: string
          requires_chassis: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at" | "status"> & { status?: string }
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>

        Relationships: never[]
      }
      vehicles: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          product_id: string | null
          type: string
          brand: string | null
          model: string | null
          serial_number: string | null
          color: string | null
          battery_type: string | null
          voltage: string | null
          power: string | null
          autonomy: string | null
          purchase_date: string | null
          warranty_until: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Insert"]>

        Relationships: never[]
      }
      stock_movements: {
        Row: {
          id: string
          company_id: string
          product_id: string
          type: string
          reason: string
          quantity: number
          previous_quantity: number
          new_quantity: number
          reference_type: string | null
          reference_id: string | null
          user_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["stock_movements"]["Row"], "id" | "created_at">
        Update: never

        Relationships: never[]
      }
      sales: {
        Row: {
          id: string
          company_id: string
          customer_id: string | null
          user_id: string
          sale_number: string
          subtotal: number
          discount: number
          total: number
          payment_status: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["sales"]["Row"], "id" | "created_at" | "updated_at" | "payment_status" | "status" | "subtotal" | "discount" | "total"> & {
          payment_status?: string
          status?: string
          subtotal?: number
          discount?: number
          total?: number
        }
        Update: Partial<Database["public"]["Tables"]["sales"]["Insert"]>

        Relationships: never[]
      }
      sale_items: {
        Row: {
          id: string
          company_id: string
          sale_id: string
          product_id: string
          quantity: number
          unit_price: number
          cost_price: number
          discount: number
          total: number
          chassis_number: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["sale_items"]["Row"], "id" | "created_at">
        Update: never

        Relationships: never[]
      }
      payments: {
        Row: {
          id: string
          company_id: string
          sale_id: string | null
          service_order_id: string | null
          method: string
          amount: number
          fee_amount: number
          installments: number
          paid_at: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>

        Relationships: never[]
      }
      service_orders: {
        Row: {
          id: string
          company_id: string
          order_number: string
          customer_id: string
          vehicle_id: string | null
          technician_id: string | null
          created_by: string
          status_id: string | null
          priority: string
          reported_problem: string
          technical_diagnosis: string | null
          internal_notes: string | null
          customer_notes: string | null
          labor_total: number
          parts_total: number
          discount: number
          total: number
          payment_status: string
          warranty_days: number
          opened_at: string
          expected_delivery_at: string | null
          completed_at: string | null
          delivered_at: string | null
          vehicle_brand: string | null
          vehicle_model: string | null
          vehicle_chassis: string | null
          mileage_km: number | null
          payment_terms: string | null
          tracking_token: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["service_orders"]["Row"], "id" | "created_at" | "updated_at" | "payment_status" | "labor_total" | "parts_total" | "discount" | "total" | "warranty_days" | "opened_at" | "technical_diagnosis" | "internal_notes" | "customer_notes" | "completed_at" | "delivered_at" | "tracking_token"> & {
          payment_status?: string
          labor_total?: number
          parts_total?: number
          discount?: number
          total?: number
          warranty_days?: number
          opened_at?: string
          technical_diagnosis?: string | null
          internal_notes?: string | null
          customer_notes?: string | null
          completed_at?: string | null
          delivered_at?: string | null
          vehicle_brand?: string | null
          vehicle_model?: string | null
          vehicle_chassis?: string | null
          mileage_km?: number | null
          payment_terms?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["service_orders"]["Insert"]>

        Relationships: never[]
      }
      service_order_statuses: {
        Row: {
          id: string
          company_id: string
          name: string
          slug: string
          color: string
          display_order: number
          is_default: boolean
          is_final: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["service_order_statuses"]["Row"], "id" | "created_at" | "updated_at" | "status"> & { status?: string }
        Update: Partial<Database["public"]["Tables"]["service_order_statuses"]["Insert"]>

        Relationships: never[]
      }
      service_order_items: {
        Row: {
          id: string
          company_id: string
          service_order_id: string
          product_id: string | null
          item_type: string
          description: string
          quantity: number
          unit_price: number
          cost_price: number
          total: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["service_order_items"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["service_order_items"]["Insert"]>

        Relationships: never[]
      }
      checklist_templates: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          is_default: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["checklist_templates"]["Row"], "id" | "created_at" | "updated_at" | "status"> & { status?: string }
        Update: Partial<Database["public"]["Tables"]["checklist_templates"]["Insert"]>

        Relationships: never[]
      }
      checklist_template_items: {
        Row: {
          id: string
          company_id: string
          template_id: string
          label: string
          input_type: string
          required: boolean
          display_order: number
          options: Json | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["checklist_template_items"]["Row"], "id" | "created_at" | "updated_at" | "status" | "options"> & { status?: string; options?: Json | null }
        Update: Partial<Database["public"]["Tables"]["checklist_template_items"]["Insert"]>

        Relationships: never[]
      }
      service_order_checklists: {
        Row: {
          id: string
          company_id: string
          service_order_id: string
          template_item_id: string | null
          item_key: string
          label: string
          value: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["service_order_checklists"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["service_order_checklists"]["Insert"]>

        Relationships: never[]
      }
      service_order_photos: {
        Row: {
          id: string
          company_id: string
          service_order_id: string
          file_url: string
          description: string | null
          created_by: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["service_order_photos"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["service_order_photos"]["Insert"]>

        Relationships: never[]
      }
      quotes: {
        Row: {
          id: string
          company_id: string
          quote_number: string
          customer_id: string
          service_order_id: string | null
          status: string
          subtotal: number
          discount: number
          total: number
          valid_until: string | null
          notes: string | null
          vehicle_brand: string | null
          vehicle_model: string | null
          created_at: string
          approved_at: string | null
          rejected_at: string | null
        }
        Insert: Omit<Database["public"]["Tables"]["quotes"]["Row"], "id" | "created_at" | "vehicle_brand" | "vehicle_model"> & {
          vehicle_brand?: string | null
          vehicle_model?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["quotes"]["Insert"]>

        Relationships: never[]
      }
      quote_items: {
        Row: {
          id: string
          company_id: string
          quote_id: string
          product_id: string | null
          item_type: string
          description: string
          quantity: number
          unit_price: number
          total: number
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["quote_items"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["quote_items"]["Insert"]>

        Relationships: never[]
      }
      warranties: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          product_id: string | null
          vehicle_id: string | null
          service_order_id: string | null
          warranty_type: string
          start_date: string
          end_date: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["warranties"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["warranties"]["Insert"]>

        Relationships: never[]
      }
      warranty_rules: {
        Row: {
          id: string
          company_id: string
          name: string
          warranty_type: string
          duration_days: number
          description: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["warranty_rules"]["Row"], "id" | "created_at" | "updated_at" | "status"> & { status?: string }
        Update: Partial<Database["public"]["Tables"]["warranty_rules"]["Insert"]>

        Relationships: never[]
      }
      cash_registers: {
        Row: {
          id: string
          company_id: string
          opened_by: string
          opened_at: string
          closed_by: string | null
          closed_at: string | null
          initial_amount: number
          actual_cash_amount: number | null
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          company_id: string
          opened_by: string
          initial_amount: number
          opened_at?: string
          status?: string
          notes?: string | null
        }
        Update: Partial<{
          closed_by: string | null
          closed_at: string | null
          actual_cash_amount: number | null
          status: string
          notes: string | null
        }>

        Relationships: never[]
      }
      cash_movements: {
        Row: {
          id: string
          company_id: string
          cash_register_id: string
          type: string
          payment_method: string
          amount: number
          description: string | null
          source_type: string | null
          source_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          company_id: string
          cash_register_id: string
          type: string
          payment_method: string
          amount: number
          description?: string | null
          source_type?: string | null
          source_id?: string | null
          created_by?: string | null
        }
        Update: never

        Relationships: never[]
      }
      revision_schedules: {
        Row: {
          id: string
          company_id: string
          customer_id: string
          source_os_id: string | null
          source_sale_id: string | null
          started_at: string
          is_active: boolean
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          customer_id: string
          source_os_id?: string | null
          source_sale_id?: string | null
          started_at?: string
          is_active?: boolean
          cancelled_at?: string | null
        }
        Update: Partial<{
          is_active: boolean
          cancelled_at: string | null
          updated_at: string
        }>
        Relationships: never[]
      }
      revision_reminders: {
        Row: {
          id: string
          schedule_id: string
          company_id: string
          remind_on: string
          notify_customer: boolean
          notify_store: boolean
          sent_at: string | null
          created_at: string
        }
        Insert: {
          schedule_id: string
          company_id: string
          remind_on: string
          notify_customer?: boolean
          notify_store?: boolean
          sent_at?: string | null
        }
        Update: Partial<{
          notify_customer: boolean
          notify_store: boolean
          sent_at: string | null
        }>
        Relationships: never[]
      }
      services: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          default_price: number
          estimated_minutes: number
          warranty_days: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["services"]["Row"], "id" | "created_at" | "updated_at" | "status"> & { status?: string }
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>

        Relationships: never[]
      }
      suppliers: {
        Row: {
          id: string
          company_id: string
          name: string
          cnpj: string | null
          phone: string | null
          whatsapp: string | null
          email: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["suppliers"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Insert"]>

        Relationships: never[]
      }
      financial_transactions: {
        Row: {
          id: string
          company_id: string
          type: string
          category_id: string | null
          description: string
          amount: number
          payment_method: string | null
          reference_type: string | null
          reference_id: string | null
          transaction_date: string
          created_by: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["financial_transactions"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["financial_transactions"]["Insert"]>

        Relationships: never[]
      }
      payment_methods: {
        Row: {
          id: string
          company_id: string
          name: string
          type: string
          active: boolean
          fee_percent: number
          installment_fees: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["payment_methods"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["payment_methods"]["Insert"]>

        Relationships: never[]
      }
      financial_categories: {
        Row: {
          id: string
          company_id: string
          name: string
          type: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["financial_categories"]["Row"], "id" | "created_at" | "updated_at" | "status"> & { status?: string }
        Update: Partial<Database["public"]["Tables"]["financial_categories"]["Insert"]>

        Relationships: never[]
      }
      message_templates: {
        Row: {
          id: string
          company_id: string
          name: string
          trigger_key: string
          content: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["message_templates"]["Row"], "id" | "created_at" | "updated_at" | "status"> & { status?: string }
        Update: Partial<Database["public"]["Tables"]["message_templates"]["Insert"]>

        Relationships: never[]
      }
      activity_logs: {
        Row: {
          id: string
          company_id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["activity_logs"]["Row"], "id" | "created_at">
        Update: never

        Relationships: never[]
      }
      company_invitations: {
        Row: {
          id: string
          company_id: string
          invited_by: string
          email: string
          role: string
          token: string
          status: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: Omit<
          Database["public"]["Tables"]["company_invitations"]["Row"],
          "id" | "token" | "status" | "expires_at" | "accepted_at" | "created_at"
        > & {
          status?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Update: Partial<
          Pick<Database["public"]["Tables"]["company_invitations"]["Row"], "status" | "accepted_at">
        >

        Relationships: never[]
      }
    }
    Views: Record<never, never>
    Functions: {
      get_current_company_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      is_saas_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      current_user_role: {
        Args: Record<string, never>
        Returns: string | null
      }
      create_company_with_owner: {
        Args: {
          p_company_name: string
          p_company_slug: string
          p_owner_name: string
          p_owner_email: string
        }
        Returns: string
      }
      setup_company_defaults: {
        Args: { p_company_id: string }
        Returns: null
      }
      accept_invitation: {
        Args: { p_token: string }
        Returns: null
      }
      expire_old_invitations: {
        Args: Record<string, never>
        Returns: null
      }
      get_os_tracking: {
        Args: { p_token: string }
        Returns: Json
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
