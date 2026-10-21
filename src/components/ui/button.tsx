import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-ink bg-ink text-white hover:bg-ink/90",
        secondary: "border-sage bg-sage text-ink hover:border-leaf hover:bg-sage/80",
        outline: "border-ink/15 bg-white text-ink hover:border-leaf hover:bg-sage",
        ghost: "border-transparent text-ink hover:bg-sage",
        destructive: "border-coral bg-coral text-white hover:bg-coral/90",
        link: "min-h-0 border-transparent px-0 text-leaf underline-offset-4 hover:underline",
        success: "border-leaf bg-leaf text-white hover:bg-leaf/90",
      },
      size: {
        default: "px-5 py-2.5",
        sm: "min-h-9 px-3 py-2 text-xs",
        lg: "min-h-12 px-6 py-3",
        icon: "h-11 w-11 min-h-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));
    if (asChild) return <Slot className={classes} ref={ref} {...props}>{children}</Slot>;
    return <button className={classes} ref={ref} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}{children}</button>;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
