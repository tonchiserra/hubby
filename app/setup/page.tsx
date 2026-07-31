import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Configuración" };

const STEPS = [
  {
    title: "Creá un proyecto en Supabase",
    body: "Entrá a supabase.com, creá un proyecto en la capa gratuita y elegí la región más cercana (São Paulo, para Argentina).",
  },
  {
    title: "Copiá las credenciales",
    body: "En Project Settings → API Keys vas a encontrar la Project URL y la publishable key. La secret key no se usa acá y no debe salir del servidor.",
  },
  {
    title: "Creá .env.local",
    body: "Copiá .env.example a .env.local y pegá los dos valores. Reiniciá el servidor de desarrollo.",
  },
  {
    title: "Aplicá las migraciones",
    body: "pnpm db:link && pnpm db:push — crea la tabla grocery_items con RLS activo.",
  },
  {
    title: "Cerrá el registro público",
    body: "En Authentication → Sign In / Providers desactivá 'Allow new users to sign up'. Después creá tu usuario desde Authentication → Users, con contraseña y Auto Confirm activado.",
  },
];

export default function SetupPage() {
  // Si ya está configurado, esta pantalla no tiene razón de existir.
  if (isSupabaseConfigured) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-largetitle">Falta conectar Supabase</h1>
        <p className="text-subhead text-muted-foreground">
          hubby está listo, pero todavía no sabe dónde guardar los datos. Son
          cinco pasos y se hace una sola vez.
        </p>
      </header>

      <ol className="flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="bg-card flex gap-3 rounded-xl p-4">
            <span className="bg-accent text-accent-foreground grid size-6 shrink-0 place-items-center rounded-full font-mono text-caption font-medium">
              {i + 1}
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-headline">{step.title}</p>
              <p className="text-footnote text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
