import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/** Rutas accesibles sin sesión. */
const PUBLIC_PREFIXES = ["/login", "/setup"];

const isPublic = (pathname: string) =>
  PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

// En Next 16 el archivo se llama proxy.ts y exporta `proxy`, no `middleware`.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sin credenciales no hay sesión que refrescar: se deja pasar para que la app
  // muestre la pantalla de configuración en lugar de fallar acá.
  if (!SUPABASE_URL || !SUPABASE_KEY) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // No insertar NADA entre createServerClient y getUser(): cualquier await en
  // el medio desincroniza el refresh del token y produce logouts aleatorios.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Para volver a donde quería entrar después de autenticarse.
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Devolver este objeto tal cual: recrearlo descarta las cookies de sesión
  // recién refrescadas y cierra la sesión del usuario sin motivo aparente.
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
