"use client";

import { useState } from "react";
import { EnvelopeSimpleIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export function LoginForm({ next }: { next?: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email) return;

    setStatus({ kind: "sending" });
    const supabase = createClient();

    const callback = new URL("/auth/callback", window.location.origin);
    if (next) callback.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callback.toString(),
        // El registro público está cerrado: si el mail no existe, no se crea
        // una cuenta nueva, simplemente no se manda el enlace.
        shouldCreateUser: false,
      },
    });

    setStatus(
      error
        ? { kind: "error", message: traducir(error.message) }
        : { kind: "sent", email },
    );
  }

  if (status.kind === "sent") {
    return (
      <div className="bg-card flex flex-col items-center gap-3 rounded-xl p-6 text-center">
        <EnvelopeSimpleIcon size={40} weight="light" className="text-primary" />
        <p className="text-headline">Revisá tu correo</p>
        <p className="text-subhead text-muted-foreground">
          Si <span className="text-foreground">{status.email}</span> tiene cuenta,
          va a recibir un enlace para entrar. Vence en una hora.
        </p>
        <Button
          variant="plain"
          size="sm"
          onClick={() => setStatus({ kind: "idle" })}
        >
          Usar otro correo
        </Button>
      </div>
    );
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
      <Button type="submit" size="lg" block disabled={status.kind === "sending"}>
        <PaperPlaneTiltIcon size={20} weight="fill" />
        {status.kind === "sending" ? "Enviando…" : "Enviarme el enlace"}
      </Button>

      {status.kind === "error" && (
        <p role="alert" className="text-footnote text-negative px-1">
          {status.message}
        </p>
      )}
    </form>
  );
}

/** Supabase responde en inglés; acá se traduce lo que el usuario puede ver. */
function traducir(message: string) {
  const m = message.toLowerCase();
  if (m.includes("rate") || m.includes("seconds"))
    return "Demasiados intentos seguidos. Esperá un minuto y probá de nuevo.";
  if (m.includes("signups not allowed") || m.includes("not found"))
    return "Ese correo no tiene cuenta en hubby.";
  if (m.includes("invalid") && m.includes("email"))
    return "Revisá el correo, parece mal escrito.";
  return "No se pudo enviar el enlace. Probá de nuevo en un momento.";
}
