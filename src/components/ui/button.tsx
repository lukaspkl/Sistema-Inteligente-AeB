import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-2 border-transparent hover:border-primary shadow-[2px_2px_0_0_hsl(var(--primary-glow))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_hsl(var(--primary-glow))] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-transparent hover:border-destructive shadow-[2px_2px_0_0_hsl(var(--destructive))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_hsl(var(--destructive))] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all",
        outline:
          "border-2 border-input bg-background shadow-[2px_2px_0_0_hsl(var(--border))] hover:bg-accent hover:text-accent-foreground hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_hsl(var(--border))] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-transparent hover:border-secondary shadow-[2px_2px_0_0_hsl(var(--secondary))] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_hsl(var(--secondary))] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all",
        ghost: "hover:bg-accent hover:text-accent-foreground border-2 border-transparent",
        link: "text-primary underline-offset-4 hover:underline border-2 border-transparent",
      },
      size: {
        default: "h-10 px-4 py-2 font-bold uppercase tracking-wider text-xs",
        sm: "h-9 rounded border-2 px-3 tracking-wide text-[10px] uppercase font-bold",
        lg: "h-11 rounded border-2 px-8 uppercase font-bold tracking-widest",
        icon: "h-10 w-10 border-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
