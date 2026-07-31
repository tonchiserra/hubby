import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Todo lo que cuelga de (app) depende de la sesión: nunca se prerenderiza.
// Sin esto el build intenta generarlo estáticamente y falla al no haber usuario.
export const dynamic = "force-dynamic";

/**
 * No hay barra de navegación. El modelo es de pila: el dashboard es el menú
 * principal y cada módulo es una pantalla a la que se entra y de la que se
 * vuelve con el botón del encabezado.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sin credenciales no hay datos que mostrar: se deriva a la pantalla que
  // explica qué falta, en vez de fallar con un error de Supabase.
  if (!isSupabaseConfigured) redirect("/setup");

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] md:py-12">
      {children}
    </main>
  );
}
