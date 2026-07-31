import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "bg-card text-body text-foreground placeholder:text-muted-foreground",
        "h-touch w-full rounded-lg px-4",
        "border border-input",
        "transition-[border-color,box-shadow] duration-150",
        "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
