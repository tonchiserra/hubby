import type { Icon } from "@/components/ui/icons";
import { IconChip } from "@/components/ui/icon-chip";
import { cn } from "@/lib/utils";

/** Pantalla o lista vacía: un bloque gris del kit con el chip del módulo. */
export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  className,
}: {
  icon: Icon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-sand flex flex-col items-center justify-center gap-3 rounded-lg px-8 py-12 text-center",
        className,
      )}
    >
      <IconChip
        icon={IconComponent}
        size="lg"
        className="bg-card mb-1 animate-[pop_0.45s_var(--ease-spring-kit)_0.1s_both]"
      />
      <div className="flex flex-col gap-1">
        <p className="text-headline display-tight">{title}</p>
        {description && (
          <p className="text-subhead text-ink-soft max-w-xs text-balance">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
