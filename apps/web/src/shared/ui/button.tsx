import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib";

const button = cva(
  "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border px-3.5 text-[13px] font-medium shadow-xs transition-colors focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-primary-soft disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-primary bg-primary text-white hover:brightness-110",
        secondary: "border-line-strong bg-surface text-ink hover:bg-surface-2",
        ghost: "border-transparent bg-transparent text-ink-2 shadow-none hover:bg-surface-2",
      },
      size: { md: "", lg: "h-[42px] px-5 text-sm", icon: "w-9 px-0" },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

/** A button in the app's style. `asChild` renders the child element (for links). */
export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof button> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(button({ variant, size }), className)} {...props} />;
}
