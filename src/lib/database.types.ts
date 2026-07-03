export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          agent_id: string | null
          ai_summary: string | null
          created_at: string | null
          customer_id: string
          id: string
          sentiment: "marah" | "netral" | "puas"
          status: "open" | "pending" | "closed"
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          ai_summary?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          sentiment?: "marah" | "netral" | "puas"
          status?: "open" | "pending" | "closed"
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          ai_summary?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          sentiment?: "marah" | "netral" | "puas"
          status?: "open" | "pending" | "closed"
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      knowledge_embeddings: {
        Row: {
          content: string
          embedding: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          embedding: string
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          embedding?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          sender_type: "customer" | "agent" | "ai_system"
        }
        Insert: {
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_type: "customer" | "agent" | "ai_system"
        }
        Update: {
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_type?: "customer" | "agent" | "ai_system"
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          email: string
          id: string
          name: string
          role: "admin" | "agent"
          updated_at: string | null
        }
        Insert: {
          email: string
          id: string
          name: string
          role?: "admin" | "agent"
          updated_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          name?: string
          role?: "admin" | "agent"
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_knowledge: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          title: string
          content: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
