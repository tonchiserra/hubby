import { redirect } from "next/navigation";
import { MoonIcon, SignOutIcon, UserIcon } from "@phosphor-icons/react/dist/ssr";

import { PageHeader } from "@/components/hubby/page-header";
import { ListGroup, ListRow } from "@/components/hubby/list";
import { Button } from "@/components/ui/button";
import { IconChip } from "@/components/ui/icon-chip";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient, getUser } from "@/lib/supabase/server";

export const metadata = { title: "Ajustes" };

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function SettingsPage() {
  const user = await getUser();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader back={{ href: "/" }} title="Ajustes" />

      <ListGroup title="Cuenta">
        <ListRow
          leading={<IconChip icon={UserIcon} size="sm" />}
          label="Sesión"
          detail={user?.email ?? "—"}
        />
      </ListGroup>

      <ListGroup title="Apariencia">
        <ListRow
          leading={<IconChip icon={MoonIcon} size="sm" />}
          label="Tema"
          detail="hubby arranca siempre en claro"
          trailing={<ThemeToggle />}
        />
      </ListGroup>

      <form action={signOut}>
        <Button type="submit" variant="destructive" block>
          <IconChip icon={SignOutIcon} size="sm" />
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
