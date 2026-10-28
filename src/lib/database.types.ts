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
          poster_path: string | null
          title: string
          type: string
          updated_at: string
          year: number | null
        }
        Insert: {
          id: number
          imdb_id?: string | null
          poster_path?: string | null
          title: string
          type: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          id?: number
          imdb_id?: string | null
          poster_path?: string | null
          title?: string
          type?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      user_titles: {
        Row: {
          is_favorite: boolean
          rating: number | null
          status: string
          title_id: number
          title_type: string
          user_id: string
          watched_at: string | null
        }
        Insert: {
          is_favorite?: boolean
          rating?: number | null
          status?: string
          title_id: number
          title_type: string
          user_id: string
          watched_at?: string | null
        }
        Update: {
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
