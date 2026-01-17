import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-terracotta text-white hover:bg-terracotta-hover",
        secondary:
          "border-transparent bg-warm-card text-warm-text hover:bg-warm-border dark:bg-warm-muted/30 dark:text-warm-bg dark:hover:bg-warm-muted/50",
        destructive:
          "border-transparent bg-status-alert text-white hover:bg-status-alert/90",
        outline: "text-warm-text dark:text-warm-bg border-warm-border dark:border-warm-muted",
        success:
          "border-transparent bg-status-success text-white hover:bg-status-success/90",
        warning:
          "border-transparent bg-status-warning text-warm-text hover:bg-status-warning/90",
        info:
          "border-transparent bg-sage text-white hover:bg-sage-hover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
