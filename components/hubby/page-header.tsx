import { cn } from "@/lib/utils";

/**
 * El Large Title de iOS. El contraste entre 34px y el footnote de 13px de abajo
 * es lo que genera jerarquía sin recurrir a color ni a bordes.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-largetitle truncate">{title}</h1>
        {subtitle && (
          <p className="text-footnote text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 pb-1">{action}</div>}
    </header>
  );
}
