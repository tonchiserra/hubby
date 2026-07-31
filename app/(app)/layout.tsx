import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Todo lo que cuelga de (app) depende de la sesión: nunca se prerenderiza.
// Sin esto el build intenta generarlo estáticamente y falla al no haber usuario.
export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sin credenciales no hay datos que mostrar: se deriva a la pantalla que
  // explica qué falta, en vez de fallar con un error de Supabase.
  if (!isSupabaseConfigured) redirect("/setup");

  return <AppShell>{children}</AppShell>;
}
