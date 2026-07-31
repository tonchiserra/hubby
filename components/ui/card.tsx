import { cn } from "@/lib/utils";

/**
 * Superficie agrupada de iOS. La jerarquía sale del contraste contra
 * --background, no de una sombra.
 */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("bg-card rounded-md", className)} {...props} />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-4 pt-3.5 pb-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-headline", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-footnote text-muted-foreground", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-4 pb-3.5", className)} {...props} />;
}
