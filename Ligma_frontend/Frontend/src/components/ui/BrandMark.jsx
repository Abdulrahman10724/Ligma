/**
 * BrandMark — LIGMA connected-nodes geometric logo.
 * CSS/SVG only, works in light and dark themes via --primary token.
 * Sizes: "sm" (20px), "md" (28px, default), "lg" (40px)
 */
export default function BrandMark({ size = "md", className = "" }) {
  const dim = size === "sm" ? 20 : size === "lg" ? 40 : 28;

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Connector lines */}
      <line x1="14" y1="4"  x2="24" y2="14" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="14" y1="4"  x2="4"  y2="14" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="4"  y1="14" x2="14" y2="24" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="24" y1="14" x2="14" y2="24" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="4"  y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />

      {/* Nodes */}
      <circle cx="14" cy="4"  r="3"   fill="currentColor" />
      <circle cx="4"  cy="14" r="2.5" fill="currentColor" fillOpacity="0.7" />
      <circle cx="24" cy="14" r="2.5" fill="currentColor" fillOpacity="0.7" />
      <circle cx="14" cy="24" r="3"   fill="currentColor" />
      {/* Central hub */}
      <circle cx="14" cy="14" r="2"   fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}

/**
 * Full brand lockup: mark + wordmark
 */
export function BrandLockup({ size = "md", showMark = true, className = "" }) {
  const textSize =
    size === "sm" ? "text-base" :
    size === "lg" ? "text-2xl"  :
    "text-lg";

  return (
    <div className={`flex items-center gap-2 text-[color:var(--primary)] ${className}`}>
      {showMark && <BrandMark size={size} />}
      <span
        className={`${textSize} font-black tracking-[0.12em] leading-none select-none`}
        style={{ letterSpacing: "0.12em" }}
      >
        LIGMA
      </span>
    </div>
  );
}
