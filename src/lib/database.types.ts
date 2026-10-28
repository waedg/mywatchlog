// Généré avec Supabase (generate_typescript_types). À régénérer après chaque migration.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      allowed_emails: {
        Row: { email: string }
        Insert: { email: string }
        Update: { email?: string }
        Relationships: []
      }
      titles: {
        Row: {
          id: number
          imdb_id: string | null
          is_ended: boolean | null
          poster_path: string | null
          season_counts: Json | null
          title: string
          type: string
          updated_at: string
          year: number | null
        }
        Insert: {
          id: number
          imdb_id?: string | null
          is_ended?: boolean | null
          season_counts?: Json | null
          poster_path?: string | null
          title: string
          type: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          id?: number
          imdb_id?: string | null
          is_ended?: boolean | null
          season_counts?: Json | null
          poster_path?: string | null
          title?: string
          type?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      user_episodes: {
        Row: {
          episode_number: number
          season_number: number
          title_id: number
          title_type: string
          user_id: string
          watched_at: string
        }
        Insert: {
          episode_number: number
          season_number: number
          title_id: number
          title_type?: string
          user_id: string
          watched_at?: string
        }
        Update: {
          episode_number?: number
          season_number?: number
          title_id?: number
          title_type?: string
          user_id?: string
          watched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_episodes_title_id_title_type_fkey'
            columns: ['title_id', 'title_type']
            isOneToOne: false
            referencedRelation: 'titles'
            referencedColumns: ['id', 'type']
          },
        ]
      }
      user_titles: {
        Row: {
          has_copy: boolean
          is_favorite: boolean
          rating: number | null
          status: string
          title_id: number
          title_type: string
          user_id: string
          watched_at: string | null
        }
        Insert: {
          has_copy?: boolean
          is_favorite?: boolean
          rating?: number | null
          status?: string
          title_id: number
          title_type: string
          user_id: string
          watched_at?: string | null
        }
        Update: {
          has_copy?: boolean
          is_favorite?: boolean
          rating?: number | null
          status?: string
          title_id?: number
          title_type?: string
          user_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_titles_title_id_title_type_fkey'
            columns: ['title_id', 'title_type']
            isOneToOne: false
            referencedRelation: 'titles'
            referencedColumns: ['id', 'type']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_allowed: { Args: never; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
