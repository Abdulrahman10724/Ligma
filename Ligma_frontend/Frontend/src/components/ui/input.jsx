import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(function Input({ className, type, ...props }, ref) {
  return (
    <InputPrimitive
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg px-3 py-2",
        "bg-[color:var(--surface)] border border-[color:var(--border)]",
        "text-sm text-[color:var(--foreground)]",
        "placeholder:text-[color:var(--foreground-muted)]",
        "transition-colors duration-150",
        "outline-none",
        "focus-visible:border-[color:var(--primary)] focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
        "disabled:pointer-events-none disabled:opacity-50 disabled:bg-[color:var(--surface-muted)]",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[color:var(--foreground)]",
        className
      )}
      {...props} />
  );
})

export { Input }
