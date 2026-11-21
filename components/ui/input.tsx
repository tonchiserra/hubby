import { cn } from "@/lib/utils";

/** Campo suelto del kit: subrayado, con la línea del acento al enfocar. */
export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn("field disabled:opacity-40", className)} {...props} />;
}
