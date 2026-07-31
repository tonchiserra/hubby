import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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
        "flex flex-col items-center justify-center gap-3 px-8 py-14 text-center",
        className,
      )}
    >
      <IconComponent size={36} weight="light" className="text-ink-faint" />
      <div className="flex flex-col gap-1">
        <p className="text-headline">{title}</p>
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
