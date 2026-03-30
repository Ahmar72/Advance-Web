import type { Database as GeneratedDatabase } from "@/types/supabase";

type FallbackDatabase = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Relationships: [];
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: string;
    };
    CompositeTypes: {
      [key: string]: Record<string, unknown>;
    };
  };
};

type HasGeneratedTables =
  keyof GeneratedDatabase["public"]["Tables"] extends never ? false : true;

export type AppDatabase = HasGeneratedTables extends true
  ? GeneratedDatabase
  : FallbackDatabase;
