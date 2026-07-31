import { cn } from "@/lib/utils";

/**
 * Cifra grande con etiqueta. Los números van en la mono (Google Sans Code) y con
 * `tabular-nums` para que no bailen al actualizarse.
 */
export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "neutral" | "positive" | "negative";
  className?: string;
}) {
  return (
    <div className={cn("bg-card flex flex-col gap-0.5 rounded-md p-4", className)}>
      <span className="text-caption2 text-muted-foreground uppercase">
        {label}
      </span>
      <span
        className={cn(
          "text-title1 tabular-nums -tracking-[0.01em]",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-destructive",
        )}
      >
        {value}
      </span>
      {hint && <span className="text-caption text-muted-foreground">{hint}</span>}
    </div>
  );
}
