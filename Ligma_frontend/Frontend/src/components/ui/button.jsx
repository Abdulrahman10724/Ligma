import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5",
    "rounded-lg border border-transparent bg-clip-padding",
    "text-sm font-medium whitespace-nowrap",
    "transition-all duration-150",
    "outline-none select-none cursor-pointer",
    "focus-visible:outline-2 focus-visible:outline-[color:var(--primary)] focus-visible:outline-offset-2",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /* Primary — solid teal, high contrast */
        default:
          "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary-hover)] border-transparent",

        /* Secondary — bordered surface */
        outline:
          "bg-[color:var(--surface)] border-[color:var(--border)] text-[color:var(--foreground)] hover:bg-[color:var(--surface-hover)] hover:border-[color:var(--border-strong)]",

        /* Ghost — transparent, subtle hover */
        ghost:
          "bg-transparent text-[color:var(--foreground-secondary)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--foreground)] border-transparent",

        /* Secondary — muted surface */
        secondary:
          "bg-[color:var(--surface-muted)] text-[color:var(--foreground)] hover:bg-[color:var(--surface-hover)] border-transparent",

        /* Destructive — danger color */
        destructive:
          "bg-[color:var(--danger-soft)] text-[color:var(--danger)] border-[color:var(--danger)]/20 hover:bg-[color:var(--danger)]/20",

        /* Link — text only */
        link:
          "text-[color:var(--primary)] underline-offset-4 hover:underline border-transparent bg-transparent",
      },
      size: {
        default: "h-9 px-3.5",
        xs:      "h-7 px-2.5 text-xs rounded-md",
        sm:      "h-8 px-3 text-sm rounded-md",
        lg:      "h-11 px-5",
        icon:    "size-9",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
