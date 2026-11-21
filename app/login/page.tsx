import { redirect } from "next/navigation";
import { rutaInterna } from "@/lib/rutas";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/setup");
  const { next } = await searchParams;

  return (
    <main className="stagger-self mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        {/* El ícono de la app, el mismo de la PWA: es el logo de hubby. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático propio */}
        <img
          src="/icon.svg"
          alt=""
          width={56}
          height={56}
          className="animate-[pop_0.5s_var(--ease-spring-kit)_both]"
        />
        <h1 className="text-display display-tight">hubby</h1>
        <p className="text-subhead text-ink-soft">
          Todo lo que trackeás, en un solo lugar.
        </p>
      </header>

      {/* Validado acá y no en el formulario: el cliente recibe una ruta que ya
          se sabe de este sitio, y así hay un solo lugar donde puede fallar. */}
      <LoginForm next={rutaInterna(next)} />
    </main>
  );
}
