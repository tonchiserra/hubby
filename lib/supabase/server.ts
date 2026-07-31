import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

/** El usuario actual, o null. Verificado contra el servidor de Auth. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
