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
          /** true = lo tenés en casa. false = se terminó, hay que comprarlo. */
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      books: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          author: string | null;
          year: number | null;
          cover_url: string | null;
          olid: string | null;
          status: BookStatus;
          format: BookFormat;
          /** 0 a 5 en pasos de 0.5. null = sin calificar. */
          rating: number | null;
          /** Año en que se leyó, no fecha. */
          read_year: number | null;
          /** Orden manual: lo decide el usuario arrastrando. */
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          author?: string | null;
          year?: number | null;
          cover_url?: string | null;
          olid?: string | null;
          status?: BookStatus;
          format?: BookFormat;
          rating?: number | null;
          read_year?: number | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          author?: string | null;
          year?: number | null;
          cover_url?: string | null;
          olid?: string | null;
          status?: BookStatus;
          format?: BookFormat;
          rating?: number | null;
          read_year?: number | null;
          position?: number;
        };
        Relationships: [];
      };

      wishes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          /** En la moneda del usuario. null = todavía no lo averiguaste. */
          price: number | null;
          /** Dónde comprarlo. Siempre http(s). */
          url: string | null;
          status: WishStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          price?: number | null;
          url?: string | null;
          status?: WishStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          price?: number | null;
          url?: string | null;
          status?: WishStatus;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      /** Reordena la biblioteca: los ids llegan en el orden nuevo. */
      reorder_books: {
        Args: { ids: string[] };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type BookStatus = "quiero" | "leyendo" | "leido";
export type BookFormat = "libro" | "audiolibro";

/**
 * 'quiero' es la pila de algún día; 'proximo' es lo que decidiste comprar.
 * La distinción existe porque una lista de deseos entera no puede reclamar
 * atención: si todo pesa, el panel deja de servir para priorizar.
 */
export type WishStatus = "quiero" | "proximo" | "comprado";

export type GroceryItem = Database["public"]["Tables"]["grocery_items"]["Row"];
export type Book = Database["public"]["Tables"]["books"]["Row"];
export type Wish = Database["public"]["Tables"]["wishes"]["Row"];
