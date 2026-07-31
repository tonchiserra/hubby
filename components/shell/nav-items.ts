// El tipo se exporta del entry principal; los componentes desde /dist/ssr.
import type { Icon } from "@phosphor-icons/react";
import { GearIcon, HouseIcon } from "@phosphor-icons/react/dist/ssr";
import { MODULES } from "@/lib/modules/registry";

export type NavItem = { href: string; label: string; icon: Icon };

/**
 * La navegación se deriva del registry: el dashboard y los ajustes son fijos,
 * los módulos aparecen solos al registrarse.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: HouseIcon },
  ...MODULES.map((m) => ({
    href: `/${m.slug}`,
    label: m.shortLabel ?? m.label,
    icon: m.icon,
  })),
  { href: "/ajustes", label: "Ajustes", icon: GearIcon },
];

/** El dashboard solo coincide de forma exacta; el resto, también en subrutas. */
export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
