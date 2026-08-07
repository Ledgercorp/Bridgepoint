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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      broadcast_reads: {
        Row: {
          broadcast_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          broadcast_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          broadcast_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_reads_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "organization_broadcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_claims: {
        Row: {
          bundle_share_id: string
          claimed_at: string
          claimed_by: string
          id: string
        }
        Insert: {
          bundle_share_id: string
          claimed_at?: string
          claimed_by: string
          id?: string
        }
        Update: {
          bundle_share_id?: string
          claimed_at?: string
          claimed_by?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_claims_bundle_share_id_fkey"
            columns: ["bundle_share_id"]
            isOneToOne: false
            referencedRelation: "bundle_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_shares: {
        Row: {
          bundle_id: string
          created_at: string
          created_by: string
          current_claims: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_claims: number | null
          notes: string | null
          share_code: string
        }
        Insert: {
          bundle_id: string
          created_at?: string
          created_by: string
          current_claims?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_claims?: number | null
          notes?: string | null
          share_code: string
        }
        Update: {
          bundle_id?: string
          created_at?: string
          created_by?: string
          current_claims?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_claims?: number | null
          notes?: string | null
          share_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_shares_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "resource_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          added_at: string | null
          collection_id: string
          id: string
          item_id: string
          item_type: string
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          id?: string
          item_id: string
          item_type: string
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          id?: string
          item_id?: string
          item_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      edu_email_verifications: {
        Row: {
          created_at: string
          edu_email: string
          expires_at: string
          id: string
          token: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          edu_email: string
          expires_at: string
          id?: string
          token: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          edu_email?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "organization_events"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_access_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
        }
        Relationships: []
      }
      instructor_code_usage: {
        Row: {
          code_id: string
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          code_id: string
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          code_id?: string
          id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_code_usage_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "instructor_access_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      item_notes: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          note_content: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          note_content: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          note_content?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_notes: {
        Row: {
          created_at: string
          educational_tags: string[] | null
          id: string
          note_content: string
          resource_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          educational_tags?: string[] | null
          id?: string
          note_content: string
          resource_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          educational_tags?: string[] | null
          id?: string
          note_content?: string
          resource_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_notes_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string
          notes: string | null
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          notes?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          notes?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "mini_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      life_tasks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          documents_needed: string[] | null
          id: string
          is_active: boolean
          order_index: number
          related_resource_categories: string[] | null
          scripts: string | null
          steps: Json
          title: string
          updated_at: string
          what_to_expect: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          documents_needed?: string[] | null
          id?: string
          is_active?: boolean
          order_index?: number
          related_resource_categories?: string[] | null
          scripts?: string | null
          steps: Json
          title: string
          updated_at?: string
          what_to_expect?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          documents_needed?: string[] | null
          id?: string
          is_active?: boolean
          order_index?: number
          related_resource_categories?: string[] | null
          scripts?: string | null
          steps?: Json
          title?: string
          updated_at?: string
          what_to_expect?: string | null
        }
        Relationships: []
      }
      mini_lessons: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          practice_prompt: string | null
          reflection_question: string | null
          scenario: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          practice_prompt?: string | null
          reflection_question?: string | null
          scenario?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          practice_prompt?: string | null
          reflection_question?: string | null
          scenario?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_broadcasts: {
        Row: {
          broadcast_type: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          message: string
          organization_id: string
          title: string
        }
        Insert: {
          broadcast_type: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          message: string
          organization_id: string
          title: string
        }
        Update: {
          broadcast_type?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          message?: string
          organization_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_broadcasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_connections: {
        Row: {
          connected_at: string
          connection_code: string
          id: string
          is_active: boolean
          last_active: string | null
          organization_id: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          connection_code: string
          id?: string
          is_active?: boolean
          last_active?: string | null
          organization_id: string
          user_id: string
        }
        Update: {
          connected_at?: string
          connection_code?: string
          id?: string
          is_active?: boolean
          last_active?: string | null
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          event_type: string
          id: string
          is_public: boolean
          location: string | null
          organization_id: string
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_type: string
          id?: string
          is_public?: boolean
          location?: string | null
          organization_id: string
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          is_public?: boolean
          location?: string | null
          organization_id?: string
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          role?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          organization_id: string
          photo_url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          organization_id: string
          photo_url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          organization_id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_programs: {
        Row: {
          contact_info: string | null
          created_at: string
          description: string
          display_order: number
          eligibility: string | null
          hours: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          description: string
          display_order?: number
          eligibility?: string | null
          hours?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          description?: string
          display_order?: number
          eligibility?: string | null
          hours?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_reminders: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          id: string
          is_completed: boolean
          message: string | null
          organization_id: string
          remind_at: string
          reminder_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_completed?: boolean
          message?: string | null
          organization_id: string
          remind_at: string
          reminder_type?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_completed?: boolean
          message?: string | null
          organization_id?: string
          remind_at?: string
          reminder_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_reviews: {
        Row: {
          created_at: string | null
          helpful_count: number | null
          id: string
          organization_id: string
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          organization_id: string
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          organization_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_shared_resources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string
          resource_data: Json
          resource_type: string
          shared_by: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id: string
          resource_data?: Json
          resource_type?: string
          shared_by: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string
          resource_data?: Json
          resource_type?: string
          shared_by?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_shared_resources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_testimonials: {
        Row: {
          author_name: string | null
          author_role: string | null
          created_at: string | null
          id: string
          organization_id: string
          testimonial_text: string
        }
        Insert: {
          author_name?: string | null
          author_role?: string | null
          created_at?: string | null
          id?: string
          organization_id: string
          testimonial_text: string
        }
        Update: {
          author_name?: string | null
          author_role?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string
          testimonial_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_testimonials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_verification_requests: {
        Row: {
          contact_name: string
          contact_phone: string | null
          created_at: string
          description: string
          id: string
          organization_domain: string | null
          organization_email: string
          organization_name: string
          organization_type: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          description: string
          id?: string
          organization_domain?: string | null
          organization_email: string
          organization_name: string
          organization_type: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          organization_domain?: string | null
          organization_email?: string
          organization_name?: string
          organization_type?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          connection_code: string | null
          created_at: string
          description: string | null
          domain: string | null
          email: string | null
          featured: boolean | null
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          onboarding_started_at: string | null
          onboarding_step: number
          organization_type: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          services: string[] | null
          state: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_seats: number
          subscription_status: string
          updated_at: string
          verified_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          connection_code?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          email?: string | null
          featured?: boolean | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          onboarding_started_at?: string | null
          onboarding_step?: number
          organization_type?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          services?: string[] | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_seats?: number
          subscription_status?: string
          updated_at?: string
          verified_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          connection_code?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          email?: string | null
          featured?: boolean | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          onboarding_started_at?: string | null
          onboarding_step?: number
          organization_type?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          services?: string[] | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_seats?: number
          subscription_status?: string
          updated_at?: string
          verified_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      passport_entries: {
        Row: {
          created_at: string
          entry_type: string
          expiry_date: string | null
          id: string
          issued_date: string | null
          issuer: string | null
          metadata: Json | null
          notes: string | null
          passport_id: string
          status: string
          title: string
          updated_at: string
          verification_code: string | null
        }
        Insert: {
          created_at?: string
          entry_type?: string
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          issuer?: string | null
          metadata?: Json | null
          notes?: string | null
          passport_id: string
          status?: string
          title: string
          updated_at?: string
          verification_code?: string | null
        }
        Update: {
          created_at?: string
          entry_type?: string
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          issuer?: string | null
          metadata?: Json | null
          notes?: string | null
          passport_id?: string
          status?: string
          title?: string
          updated_at?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passport_entries_passport_id_fkey"
            columns: ["passport_id"]
            isOneToOne: false
            referencedRelation: "resource_passports"
            referencedColumns: ["id"]
          },
        ]
      }
      passport_shares: {
        Row: {
          access_level: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          passport_id: string
          share_code: string
          shared_with_org: string | null
          shared_with_user: string | null
        }
        Insert: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          passport_id: string
          share_code: string
          shared_with_org?: string | null
          shared_with_user?: string | null
        }
        Update: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          passport_id?: string
          share_code?: string
          shared_with_org?: string | null
          shared_with_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passport_shares_passport_id_fkey"
            columns: ["passport_id"]
            isOneToOne: false
            referencedRelation: "resource_passports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passport_shares_shared_with_org_fkey"
            columns: ["shared_with_org"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_study_participants: {
        Row: {
          id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          room_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_study_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_items: {
        Row: {
          id: string
          item_id: string
          item_title: string
          item_type: string
          pinned_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          item_title: string
          item_type: string
          pinned_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          item_title?: string
          item_type?: string
          pinned_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      professional_email_verifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          professional_email: string
          professional_role: string | null
          token: string
          user_id: string
          verified: boolean
          verified_by_admin: boolean | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          professional_email: string
          professional_role?: string | null
          token: string
          user_id: string
          verified?: boolean
          verified_by_admin?: boolean | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          professional_email?: string
          professional_role?: string | null
          token?: string
          user_id?: string
          verified?: boolean
          verified_by_admin?: boolean | null
        }
        Relationships: []
      }
      quick_task_usage: {
        Row: {
          id: string
          task_key: string
          used_at: string
        }
        Insert: {
          id?: string
          task_key: string
          used_at?: string
        }
        Update: {
          id?: string
          task_key?: string
          used_at?: string
        }
        Relationships: []
      }
      recent_activity: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          item_data: Json | null
          item_id: string
          item_title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          item_data?: Json | null
          item_id: string
          item_title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          item_data?: Json | null
          item_id?: string
          item_title?: string
          user_id?: string
        }
        Relationships: []
      }
      resource_bundles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          notes: string | null
          resources: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          resources?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          resources?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resource_kit_items: {
        Row: {
          created_at: string
          id: string
          kit_id: string
          resource_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kit_id: string
          resource_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kit_id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "resource_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_kit_items_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_kits: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resource_passports: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resource_reports: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          reason: string
          resource_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          reason: string
          resource_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          reason?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_reports_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          accessibility: string | null
          address: string | null
          category: string
          cost: string
          created_at: string
          description: string
          eligibility: string
          hours: string
          id: string
          is_active: boolean
          languages: string[] | null
          last_check_status: string | null
          last_checked_at: string | null
          last_reported_at: string | null
          latitude: number | null
          longitude: number | null
          name: string
          needs_review: boolean
          phone: string
          report_count: number
          transportation: string | null
          updated_at: string
          verified_at: string | null
          website: string | null
        }
        Insert: {
          accessibility?: string | null
          address?: string | null
          category: string
          cost: string
          created_at?: string
          description: string
          eligibility: string
          hours: string
          id?: string
          is_active?: boolean
          languages?: string[] | null
          last_check_status?: string | null
          last_checked_at?: string | null
          last_reported_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          needs_review?: boolean
          phone: string
          report_count?: number
          transportation?: string | null
          updated_at?: string
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          accessibility?: string | null
          address?: string | null
          category?: string
          cost?: string
          created_at?: string
          description?: string
          eligibility?: string
          hours?: string
          id?: string
          is_active?: boolean
          languages?: string[] | null
          last_check_status?: string | null
          last_checked_at?: string | null
          last_reported_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          needs_review?: boolean
          phone?: string
          report_count?: number
          transportation?: string | null
          updated_at?: string
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      saved_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string | null
          file_url: string | null
          id: string
          notes: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_navigation_steps: {
        Row: {
          category: string | null
          created_at: string
          id: string
          resources: Json | null
          steps: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          resources?: Json | null
          steps: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          resources?: Json | null
          steps?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_bundle_access: {
        Row: {
          bundle_id: string
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string
          shared_at: string
          shared_by: string
        }
        Insert: {
          bundle_id: string
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id: string
          shared_at?: string
          shared_by: string
        }
        Update: {
          bundle_id?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string
          shared_at?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_bundle_access_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "resource_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_bundle_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_study_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_study_notes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_moderation_log: {
        Row: {
          action: string
          created_at: string
          id: string
          moderator_id: string
          reason: string | null
          room_id: string
          target_content_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          moderator_id: string
          reason?: string | null
          room_id: string
          target_content_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          moderator_id?: string
          reason?: string | null
          room_id?: string
          target_content_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_room_moderation_log_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_participants: {
        Row: {
          id: string
          joined_at: string
          last_active: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_active?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_active?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_resources: {
        Row: {
          added_at: string
          added_by: string
          id: string
          resource_id: string
          room_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          id?: string
          resource_id: string
          room_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          id?: string
          resource_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_resources_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_rooms: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean
          max_participants: number | null
          moderation_mode: string
          moderator_id: string | null
          name: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean
          max_participants?: number | null
          moderation_mode?: string
          moderator_id?: string | null
          name: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean
          max_participants?: number | null
          moderation_mode?: string
          moderator_id?: string | null
          name?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_threads: {
        Row: {
          auto_delete_at: string
          community_user_id: string
          created_at: string
          expires_at: string
          id: string
          organization_id: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          auto_delete_at?: string
          community_user_id: string
          created_at?: string
          expires_at?: string
          id?: string
          organization_id: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          auto_delete_at?: string
          community_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          organization_id?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_threads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_reminders: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          remind_at: string
          task_id: string
          task_title: string
          task_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          remind_at: string
          task_id: string
          task_title: string
          task_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          remind_at?: string
          task_id?: string
          task_title?: string
          task_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_board_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_board_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "team_board_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_board_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_board_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_messages: {
        Row: {
          created_at: string
          id: string
          is_moderated: boolean
          message_content: string
          moderation_flags: Json | null
          sender_id: string
          sender_type: string
          thread_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_moderated?: boolean
          message_content: string
          moderation_flags?: Json | null
          sender_id: string
          sender_type: string
          thread_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_moderated?: boolean
          message_content?: string
          moderation_flags?: Json | null
          sender_id?: string
          sender_type?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          current_mode: string
          display_name: string | null
          edu_email: string | null
          email: string
          first_name: string | null
          has_completed_onboarding: boolean
          home_location: string | null
          home_location_type: string | null
          id: string
          is_edu_verified: boolean
          is_instructor_verified: boolean
          is_professional_verified: boolean
          preferences: Json | null
          professional_email: string | null
          professional_role: string | null
          solace_personality: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_mode?: string
          display_name?: string | null
          edu_email?: string | null
          email: string
          first_name?: string | null
          has_completed_onboarding?: boolean
          home_location?: string | null
          home_location_type?: string | null
          id?: string
          is_edu_verified?: boolean
          is_instructor_verified?: boolean
          is_professional_verified?: boolean
          preferences?: Json | null
          professional_email?: string | null
          professional_role?: string | null
          solace_personality?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_mode?: string
          display_name?: string | null
          edu_email?: string | null
          email?: string
          first_name?: string | null
          has_completed_onboarding?: boolean
          home_location?: string | null
          home_location_type?: string | null
          id?: string
          is_edu_verified?: boolean
          is_instructor_verified?: boolean
          is_professional_verified?: boolean
          preferences?: Json | null
          professional_email?: string | null
          professional_role?: string | null
          solace_personality?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          is_shared: boolean
          organization_id: string | null
          title: string
          updated_at: string
          use_count: number
          workflow_data: Json
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_shared?: boolean
          organization_id?: string | null
          title: string
          updated_at?: string
          use_count?: number
          workflow_data?: Json
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_shared?: boolean
          organization_id?: string | null
          title?: string
          updated_at?: string
          use_count?: number
          workflow_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "workflow_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_bundle_share_code: { Args: never; Returns: string }
      generate_org_connection_code: {
        Args: { org_id: string }
        Returns: string
      }
      get_organization_seat_usage: {
        Args: { org_id: string }
        Returns: {
          available_seats: number
          total_seats: number
          used_seats: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { user_id: string }; Returns: boolean }
      regenerate_org_connection_code: {
        Args: { org_id: string }
        Returns: string
      }
      validate_instructor_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "instructor"
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
      app_role: ["admin", "moderator", "user", "instructor"],
    },
  },
} as const
