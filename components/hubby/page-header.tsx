import { cn } from "@/lib/utils";

/**
 * Large Title de iOS: 34px bold, con tracking apenas negativo. En iOS el título
 * grande vive pegado al borde izquierdo y con mucho aire abajo — el contraste
 * con el footnote de 13px es lo que crea la jerarquía, sin líneas ni color.
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
    <header className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-largetitle -tracking-[0.02em]">{title}</h1>
        {subtitle && (
          <p className="text-subhead text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
