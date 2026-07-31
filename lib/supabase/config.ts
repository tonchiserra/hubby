/**
 * Un proyecto sin configurar es el estado normal al clonar el repo, no un error.
 * Chequearlo acá permite mostrar una pantalla que explica qué falta, en vez de
 * reventar en runtime con un error de Supabase difícil de interpretar.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Para los sitios donde ya se verificó la configuración y hacen falta no-nulas. */
export function requireSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copiá .env.example a .env.local.",
    );
  }
  return { url: SUPABASE_URL, key: SUPABASE_KEY };
}
