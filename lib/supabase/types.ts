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
      task_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          reset_kind: ResetKind;
          /** Semanal: 0 = domingo … 6 = sábado. Mensual y anual: día del mes. */
          reset_day: number | null;
          /** Solo anual: 1 = enero … 12 = diciembre. */
          reset_month: number | null;
          /** Fecha local `YYYY-MM-DD` del último reinicio aplicado. */
          last_reset_on: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          reset_kind?: ResetKind;
          reset_day?: number | null;
          reset_month?: number | null;
          last_reset_on?: string;
        };
        Update: {
          name?: string;
          reset_kind?: ResetKind;
          reset_day?: number | null;
          reset_month?: number | null;
          last_reset_on?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          list_id: string;
          title: string;
          done: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          list_id: string;
          title: string;
          done?: boolean;
        };
        Update: {
          title?: string;
          done?: boolean;
        };
        // La foreign key se declara acá y no solo en la base: es de donde el
        // cliente deduce que `task_lists.select("*, tasks(*)")` devuelve un
        // arreglo de tareas. Sin esto el embed no tipa.
        Relationships: [
          {
            foreignKeyName: "tasks_list_id_fkey";
            columns: ["list_id"];
            isOneToOne: false;
            referencedRelation: "task_lists";
            referencedColumns: ["id"];
          },
        ];
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

/**
 * Cada cuánto una lista de tareas vuelve entera a pendiente. 'nunca' es una
 * lista común; el resto son las que se repiten -las cuentas del mes, la
 * limpieza de la semana- y son el motivo del módulo.
 */
export type ResetKind = "nunca" | "semanal" | "mensual" | "anual";

export type GroceryItem = Database["public"]["Tables"]["grocery_items"]["Row"];
export type Book = Database["public"]["Tables"]["books"]["Row"];
export type Wish = Database["public"]["Tables"]["wishes"]["Row"];
export type TaskList = Database["public"]["Tables"]["task_lists"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
