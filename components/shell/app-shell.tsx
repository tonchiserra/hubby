"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav-items";

/**
 * Un solo componente, dos layouts. Los tokens no cambian entre breakpoints —
 * ahí vive la identidad — pero sí los patrones: tab bar inferior en móvil,
 * sidebar con hover en desktop, que en iOS directamente no existe.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <DesktopSidebar pathname={pathname} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-12">
        {children}
      </main>

      <MobileTabBar pathname={pathname} />
    </div>
  );
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="border-separator hidden w-60 shrink-0 border-r px-3 py-6 md:block">
      <Link href="/" className="mb-6 flex items-center gap-2 px-3">
        <span className="text-title3">hubby</span>
      </Link>
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-touch items-center gap-3 rounded-md px-3 text-callout transition-colors",
                active
                  ? "bg-fill-tertiary text-primary font-medium"
                  : "text-muted-foreground hover:bg-fill-tertiary hover:text-foreground",
              )}
            >
              <Icon size={22} weight={active ? "fill" : "regular"} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      className="glass border-glass-border fixed inset-x-0 bottom-0 z-50 flex border-t pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Navegación principal"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-touch flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            {/* El paso de contorno a relleno al activarse es el gesto de iOS. */}
            <Icon size={24} weight={active ? "fill" : "regular"} />
            <span className="text-caption2">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
