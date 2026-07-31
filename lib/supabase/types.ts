/**
 * Tipos del esquema. Regenerar tras cada migración con:
 *   pnpm db:types
 *
 * Se mantiene a mano hasta que el proyecto esté linkeado; a partir de ahí lo
 * pisa la salida del CLI y deja de editarse manualmente.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      grocery_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          quantity: number;
          done: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          quantity?: number;
          done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          quantity?: number;
          done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type GroceryItem = Database["public"]["Tables"]["grocery_items"]["Row"];
