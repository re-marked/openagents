// Auto-generated types will be placed here by: supabase gen types typescript
// Run: pnpm dlx supabase gen types typescript --project-id <project-id> > packages/db/src/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          display_name: string | null
          avatar_url: string | null
          role: 'user' | 'creator' | 'admin'
          stripe_customer_id: string | null
          github_username: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'creator' | 'admin'
          stripe_customer_id?: string | null
          github_username?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'creator' | 'admin'
          stripe_customer_id?: string | null
          github_username?: string | null
        }
      }
      agents: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          creator_id: string
          slug: string
          name: string
          tagline: string
          description: string
          category: string
          icon_url: string | null
          status: 'draft' | 'review' | 'published' | 'suspended'
          pricing_model: 'free' | 'per_session' | 'per_task'
          credits_per_session: number | null
          github_repo_url: string | null
          fly_app_name: string | null
          version: string
          rating_average: number
          rating_count: number
          hire_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          creator_id: string
          slug: string
          name: string
          tagline: string
          description: string
          category: string
          icon_url?: string | null
          status?: 'draft' | 'review' | 'published' | 'suspended'
          pricing_model?: 'free' | 'per_session' | 'per_task'
          credits_per_session?: number | null
          github_repo_url?: string | null
          fly_app_name?: string | null
          version?: string
          rating_average?: number
          rating_count?: number
          hire_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          creator_id?: string
          slug?: string
          name?: string
          tagline?: string
          description?: string
          category?: string
          icon_url?: string | null
          status?: 'draft' | 'review' | 'published' | 'suspended'
          pricing_model?: 'free' | 'per_session' | 'per_task'
          credits_per_session?: number | null
          github_repo_url?: string | null
          fly_app_name?: string | null
          version?: string
          rating_average?: number
          rating_count?: number
          hire_count?: number
        }
      }
      agent_instances: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          agent_id: string
          fly_machine_id: string | null
          fly_app_name: string | null
          status: 'provisioning' | 'running' | 'suspended' | 'stopped' | 'error'
          last_active_at: string | null
          gateway_token: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          agent_id: string
          fly_machine_id?: string | null
          fly_app_name?: string | null
          status?: 'provisioning' | 'running' | 'suspended' | 'stopped' | 'error'
          last_active_at?: string | null
          gateway_token?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          agent_id?: string
          fly_machine_id?: string | null
          fly_app_name?: string | null
          status?: 'provisioning' | 'running' | 'suspended' | 'stopped' | 'error'
          last_active_at?: string | null
          gateway_token?: string | null
        }
      }
      sessions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          agent_instance_id: string
          status: 'active' | 'completed' | 'expired'
          credits_used: number
          ended_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          agent_instance_id: string
          status?: 'active' | 'completed' | 'expired'
          credits_used?: number
          ended_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          agent_instance_id?: string
          status?: 'active' | 'completed' | 'expired'
          credits_used?: number
          ended_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used: number | null
          relay_type: 'web' | 'telegram' | 'slack' | 'discord' | null
        }
        Insert: {
          id?: string
          created_at?: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used?: number | null
          relay_type?: 'web' | 'telegram' | 'slack' | 'discord' | null
        }
        Update: {
          id?: string
          created_at?: string
          session_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          tokens_used?: number | null
          relay_type?: 'web' | 'telegram' | 'slack' | 'discord' | null
        }
      }
      credit_balances: {
        Row: {
          id: string
          user_id: string
          balance: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          amount: number
          type: 'purchase' | 'usage' | 'refund' | 'bonus'
          description: string | null
          stripe_payment_intent_id: string | null
          session_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          amount: number
          type: 'purchase' | 'usage' | 'refund' | 'bonus'
          description?: string | null
          stripe_payment_intent_id?: string | null
          session_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          amount?: number
          type?: 'purchase' | 'usage' | 'refund' | 'bonus'
          description?: string | null
          stripe_payment_intent_id?: string | null
          session_id?: string | null
        }
      }
      usage_events: {
        Row: {
          id: string
          created_at: string
          user_id: string
          agent_id: string
          session_id: string
          event_type: 'token' | 'compute_second' | 'tool_call'
          quantity: number
          credits_charged: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          agent_id: string
          session_id: string
          event_type: 'token' | 'compute_second' | 'tool_call'
          quantity: number
          credits_charged: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          agent_id?: string
          session_id?: string
          event_type?: 'token' | 'compute_second' | 'tool_call'
          quantity?: number
          credits_charged?: number
        }
      }
      creator_earnings: {
        Row: {
          id: string
          created_at: string
          creator_id: string
          agent_id: string
          session_id: string
          gross_credits: number
          platform_fee_credits: number
          net_credits: number
          paid_out: boolean
          stripe_transfer_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          creator_id: string
          agent_id: string
          session_id: string
          gross_credits: number
          platform_fee_credits: number
          net_credits: number
          paid_out?: boolean
          stripe_transfer_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          creator_id?: string
          agent_id?: string
          session_id?: string
          gross_credits?: number
          platform_fee_credits?: number
          net_credits?: number
          paid_out?: boolean
          stripe_transfer_id?: string | null
        }
      }
      agent_reviews: {
        Row: {
          id: string
          created_at: string
          user_id: string
          agent_id: string
          rating: number
          comment: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          agent_id: string
          rating: number
          comment?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          agent_id?: string
          rating?: number
          comment?: string | null
        }
      }
      relay_connections: {
        Row: {
          id: string
          created_at: string
          user_id: string
          agent_instance_id: string
          relay_type: 'telegram' | 'slack' | 'discord' | 'whatsapp'
          relay_user_id: string
          relay_chat_id: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          agent_instance_id: string
          relay_type: 'telegram' | 'slack' | 'discord' | 'whatsapp'
          relay_user_id: string
          relay_chat_id?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          agent_instance_id?: string
          relay_type?: 'telegram' | 'slack' | 'discord' | 'whatsapp'
          relay_user_id?: string
          relay_chat_id?: string | null
          is_active?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
