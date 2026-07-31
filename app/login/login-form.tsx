"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon, SignInIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) return;

    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(traducir(error.message));
      setPending(false);
      return;
    }

    // El cliente del navegador ya dejó las cookies puestas; refresh() hace que
    // el servidor vuelva a renderizar viendo la sesión nueva.
    router.replace(next?.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input
        name="email"
        type="email"
        placeholder="tu@correo.com"
        aria-label="Correo electrónico"
        autoComplete="email"
        autoFocus
        required
      />

      <div className="relative">
        <Input
          name="password"
          type={visible ? "text" : "password"}
          placeholder="Contraseña"
          aria-label="Contraseña"
          autoComplete="current-password"
          className="pr-12"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="text-ink-soft hover:text-ink absolute inset-y-0 right-0 grid w-12 place-items-center transition-colors"
        >
          {visible ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
        </button>
      </div>

      <Button type="submit" size="lg" block disabled={pending}>
        <SignInIcon size={20} weight="bold" />
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      {error && (
        <p role="alert" className="text-footnote text-danger px-1">
          {error}
        </p>
      )}
    </form>
  );
}

/** Supabase responde en inglés; acá se traduce lo que el usuario puede ver. */
function traducir(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed"))
    return "La cuenta todavía no está confirmada.";
  if (m.includes("rate") || m.includes("seconds"))
    return "Demasiados intentos seguidos. Esperá un minuto y probá de nuevo.";
  return "No se pudo entrar. Probá de nuevo en un momento.";
}
