import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "w-full min-w-0 rounded-lg px-3 py-2.5",
        "bg-[color:var(--surface)] border border-[color:var(--border)]",
        "text-sm text-[color:var(--foreground)] leading-relaxed",
        "placeholder:text-[color:var(--foreground-muted)]",
        "transition-colors duration-150 resize-y",
        "outline-none",
        "focus-visible:border-[color:var(--primary)] focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
        "disabled:pointer-events-none disabled:opacity-50 disabled:bg-[color:var(--surface-muted)]",
        className
      )}
      {...props}
    />
  );
})

export { Textarea }
