"use client";

import Link from "next/link";
import { useViewTransitionNavigate } from "@/lib/view-transition";

/**
 * Enlace que envuelve la navegación en una view transition.
 *
 * Existe como componente aparte para que la frontera cliente/servidor quede en
 * el lugar más chico posible: si `ModuleCard` entero fuera de cliente, su prop
 * `icon` -que es un componente, o sea una función- no podría cruzar desde el
 * Server Component que lo renderiza. Los children ya vienen renderizados como
 * elementos, y esos sí serializan.
 */
export function TransitionLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const navegar = useViewTransitionNavigate();

  return (
    <Link
      href={href}
      // Se conserva el href real: cmd+click, botón del medio y "abrir en
      // pestaña nueva" siguen funcionando, y sigue siendo un link de verdad.
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navegar(href);
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
