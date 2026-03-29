import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"
import { Spinner } from "./Spinner"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth = false, asChild = false, isLoading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" && "bg-primary text-white hover:bg-[#D9460A]",
          variant === "secondary" && "border border-charcoal text-charcoal bg-transparent hover:bg-gray-100",
          variant === "ghost" && "text-primary hover:bg-orange-50 bg-transparent",
          variant === "danger" && "bg-red-500 text-white hover:bg-red-600",
          size === "sm" && "h-9 px-3",
          size === "md" && "h-11 px-6 py-2",
          size === "lg" && "h-14 px-8",
          fullWidth && "w-full",
          className
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Spinner size="sm" className={cn("mr-2", variant !== "primary" && variant !== "danger" ? "text-primary" : "text-white")} />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }
export default Button
