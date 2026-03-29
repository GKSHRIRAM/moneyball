import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  rightElement?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, required, disabled, rightElement, name, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full relative">
        <label htmlFor={name} className="flex gap-1 text-sm font-medium text-charcoal">
          {label}
          {required && <span className="text-primary">*</span>}
        </label>
        <div className="relative">
          <input
            id={name}
            name={name}
            type={type}
            disabled={disabled}
            className={cn(
              "flex h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500 focus:ring-red-500",
              rightElement && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
export default Input
