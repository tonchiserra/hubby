import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { requireSupabaseEnv } from "./config";
import type { Database } from "./types";

export async function createClient() {
  const { url, key } = requireSupabaseEnv();
  // En Next 16 cookies() es async.
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component: ahí las cookies son de solo
          // lectura. Es esperable e inocuo, porque proxy.ts ya refrescó la
          // sesión antes de que se renderice.
        }
      },
    },
  });
}

/**
 * El usuario actual, o null, leído de los claims del JWT.
 *
 * `getClaims()` y no `getUser()`, como en Platita: el proyecto firma con
 * ES256, así que los claims se verifican localmente contra el JWKS (que la
 * librería cachea), en vez de ir y volver al servidor de Auth en cada
 * render. El costo es el mismo punto ciego que ya tiene RLS: una sesión
 * revocada antes de vencer sigue valiendo hasta su `exp`.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
});
