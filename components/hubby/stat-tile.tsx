import { cn } from "@/lib/utils";

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
  tone?: "neutral" | "attention";
  className?: string;
}) {
  const reclama = tone === "attention";

  return (
    <div
      className={cn(
        "shadow-card flex flex-col gap-1 rounded-lg p-5",
        reclama ? "bg-accent text-accent-ink" : "bg-card text-ink",
        className,
      )}
    >
      <span
        className={cn(
          "text-micro font-medium tracking-wide uppercase",
          reclama ? "opacity-75" : "text-ink-soft",
        )}
      >
        {label}
      </span>
      <span className="text-title1 display-tight tabular-nums">{value}</span>
      {hint && (
        <span
          className={cn("text-caption", reclama ? "opacity-75" : "text-ink-soft")}
        >
          {hint}
        </span>
      )}
    </div>
  );
}
