export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      card_reviews: {
        Row: {
          card_id: string;
          created_at: string;
          id: string;
          rating: number;
          reviewed_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          card_id: string;
          created_at?: string;
          id?: string;
          rating: number;
          reviewed_at?: string;
          user_id?: string;
        };
        Update: {
          card_id?: string;
          created_at?: string;
          id?: string;
          rating?: number;
          reviewed_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "card_reviews_card_fkey";
            columns: ["card_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "cards";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "card_reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cards: {
        Row: {
          back: string;
          created_at: string;
          deck_id: string;
          due_at: string;
          front: string;
          fsrs_state: Json | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          back: string;
          created_at?: string;
          deck_id: string;
          due_at?: string;
          front: string;
          fsrs_state?: Json | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          back?: string;
          created_at?: string;
          deck_id?: string;
          due_at?: string;
          front?: string;
          fsrs_state?: Json | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cards_deck_fkey";
            columns: ["deck_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "decks";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "cards_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          role: string;
          thread_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          role: string;
          thread_id: string;
          user_id?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          role?: string;
          thread_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_fkey";
            columns: ["thread_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "chat_threads";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_threads: {
        Row: {
          created_at: string;
          id: string;
          note_id: string | null;
          subject_id: string | null;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          note_id?: string | null;
          subject_id?: string | null;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          note_id?: string | null;
          subject_id?: string | null;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_threads_note_fkey";
            columns: ["note_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "chat_threads_subject_fkey";
            columns: ["subject_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "chat_threads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      class_meetings: {
        Row: {
          created_at: string;
          day_of_week: number;
          end_time: string;
          id: string;
          location: string | null;
          start_time: string;
          subject_id: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          day_of_week: number;
          end_time: string;
          id?: string;
          location?: string | null;
          start_time: string;
          subject_id: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          location?: string | null;
          start_time?: string;
          subject_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_meetings_subject_fkey";
            columns: ["subject_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "class_meetings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      decks: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          source_note_id: string | null;
          subject_id: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          source_note_id?: string | null;
          subject_id: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          source_note_id?: string | null;
          subject_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decks_source_note_fkey";
            columns: ["source_note_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "decks_subject_fkey";
            columns: ["subject_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "decks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          all_day: boolean;
          completed_at: string | null;
          created_at: string;
          ends_at: string | null;
          id: string;
          starts_at: string;
          subject_id: string | null;
          title: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          all_day?: boolean;
          completed_at?: string | null;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          starts_at: string;
          subject_id?: string | null;
          title: string;
          type: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          all_day?: boolean;
          completed_at?: string | null;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          starts_at?: string;
          subject_id?: string | null;
          title?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_subject_fkey";
            columns: ["subject_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      grade_categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          subject_id: string;
          updated_at: string;
          user_id: string;
          weight: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          subject_id: string;
          updated_at?: string;
          user_id?: string;
          weight: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          subject_id?: string;
          updated_at?: string;
          user_id?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: "grade_categories_subject_fkey";
            columns: ["subject_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "grade_categories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      grade_items: {
        Row: {
          category_id: string;
          created_at: string;
          graded_on: string | null;
          id: string;
          max_score: number;
          name: string;
          score: number | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          created_at?: string;
          graded_on?: string | null;
          id?: string;
          max_score: number;
          name: string;
          score?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          graded_on?: string | null;
          id?: string;
          max_score?: number;
          name?: string;
          score?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grade_items_category_fkey";
            columns: ["category_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "grade_categories";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "grade_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      grading_scale_bands: {
        Row: {
          created_at: string;
          grade_point: number | null;
          id: string;
          label: string;
          min_percent: number;
          scale_id: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          grade_point?: number | null;
          id?: string;
          label: string;
          min_percent: number;
          scale_id: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          grade_point?: number | null;
          id?: string;
          label?: string;
          min_percent?: number;
          scale_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grading_scale_bands_scale_fkey";
            columns: ["scale_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "grading_scales";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "grading_scale_bands_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      grading_scales: {
        Row: {
          average_label: string;
          base_percent: number;
          created_at: string;
          higher_is_better: boolean;
          id: string;
          name: string;
          passing_grade_point: number | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          average_label?: string;
          base_percent?: number;
          created_at?: string;
          higher_is_better?: boolean;
          id?: string;
          name: string;
          passing_grade_point?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          average_label?: string;
          base_percent?: number;
          created_at?: string;
          higher_is_better?: boolean;
          id?: string;
          name?: string;
          passing_grade_point?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grading_scales_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      note_files: {
        Row: {
          created_at: string;
          file_name: string;
          id: string;
          mime_type: string | null;
          note_id: string;
          size_bytes: number | null;
          storage_path: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          file_name: string;
          id?: string;
          mime_type?: string | null;
          note_id: string;
          size_bytes?: number | null;
          storage_path: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          id?: string;
          mime_type?: string | null;
          note_id?: string;
          size_bytes?: number | null;
          storage_path?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "note_files_note_fkey";
            columns: ["note_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "note_files_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          content: Json | null;
          created_at: string;
          id: string;
          plain_text: string | null;
          search_vector: unknown;
          subject_id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          content?: Json | null;
          created_at?: string;
          id?: string;
          plain_text?: string | null;
          search_vector?: never;
          subject_id: string;
          title: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          content?: Json | null;
          created_at?: string;
          id?: string;
          plain_text?: string | null;
          search_vector?: never;
          subject_id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_subject_fkey";
            columns: ["subject_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "notes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          default_grading_scale_id: string | null;
          display_name: string | null;
          id: string;
          timezone: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          default_grading_scale_id?: string | null;
          display_name?: string | null;
          id: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_grading_scale_id?: string | null;
          display_name?: string | null;
          id?: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_default_grading_scale_fkey";
            columns: ["default_grading_scale_id", "id"];
            isOneToOne: false;
            referencedRelation: "grading_scales";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      subjects: {
        Row: {
          archived_at: string | null;
          code: string | null;
          color: string | null;
          created_at: string;
          grading_scale_id: string | null;
          id: string;
          instructor: string | null;
          name: string;
          term_id: string | null;
          units: number | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          code?: string | null;
          color?: string | null;
          created_at?: string;
          grading_scale_id?: string | null;
          id?: string;
          instructor?: string | null;
          name: string;
          term_id?: string | null;
          units?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          archived_at?: string | null;
          code?: string | null;
          color?: string | null;
          created_at?: string;
          grading_scale_id?: string | null;
          id?: string;
          instructor?: string | null;
          name?: string;
          term_id?: string | null;
          units?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subjects_grading_scale_fkey";
            columns: ["grading_scale_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "grading_scales";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "subjects_term_fkey";
            columns: ["term_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "terms";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "subjects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      terms: {
        Row: {
          created_at: string;
          end_date: string;
          id: string;
          name: string;
          start_date: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          end_date: string;
          id?: string;
          name: string;
          start_date: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          end_date?: string;
          id?: string;
          name?: string;
          start_date?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "terms_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_chat_thread: {
        Args: { p_message: string; p_note_id: string; p_subject_id: string; p_title: string };
        Returns: string;
      };
      note_storage_used_bytes: { Args: Record<PropertyKey, never>; Returns: number };
      record_card_review: {
        Args: { p_card_id: string; p_due_at: string; p_fsrs_state: Json; p_rating: number };
        Returns: undefined;
      };
      save_grading_scale: {
        Args: {
          p_average_label: string;
          p_bands: Json;
          p_base_percent: number;
          p_higher_is_better: boolean;
          p_id: string;
          p_name: string;
          p_passing_grade_point: number;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
