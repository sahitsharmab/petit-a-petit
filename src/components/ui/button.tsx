import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,box-shadow,transform,color,border-color] duration-150 select-none disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-[1.1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-ink hover:bg-primary-hover shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_6px_14px_-6px_var(--primary)]",
        secondary: "bg-surface-2 text-ink hover:bg-border/70",
        outline: "border border-border bg-surface text-ink hover:bg-surface-2",
        ghost: "text-muted hover:text-ink hover:bg-surface-2",
        success: "bg-success text-white hover:brightness-110 dark:text-[#0d1f1b]",
        danger: "bg-danger text-white hover:brightness-110 dark:text-[#2a1110]",
      },
      size: {
        sm: "h-9 rounded-xl px-3.5 text-sm",
        md: "h-11 rounded-xl px-5 text-[0.95rem]",
        lg: "h-13 rounded-2xl px-7 text-base",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
