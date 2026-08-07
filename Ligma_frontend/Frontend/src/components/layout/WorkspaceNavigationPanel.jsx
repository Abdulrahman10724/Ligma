import { NavLink } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { BrandLockup } from "../ui/BrandMark";

/**
 * WorkspaceNavigationPanel — expandable 216px labeled navigation panel.
 * Desktop: pushes content (rendered in the flex layout).
 * Tablet: overlays content (absolute position, z-40).
 *
 * Props:
 *   navigation    — array of { name, href, icon: Component }
 *   workspaceName — current workspace title for context display
 *   onClose       — called when user clicks close or presses Escape
 */
export default function WorkspaceNavigationPanel({
  navigation,
  workspaceName,
  onClose,
}) {
  return (
    <>
      {/* Tablet overlay backdrop */}
      <div
        className="fixed inset-0 z-30 cursor-pointer bg-black/20 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={[
          "flex flex-col h-full bg-[color:var(--surface)] border-r border-[color:var(--border)]",
          "panel-slide-in",
          /* Desktop: in-flow. Tablet: absolute overlay over the rail */
          "absolute lg:relative z-40 lg:z-auto",
        ].join(" ")}
        style={{ width: "216px", left: "60px", top: 0, bottom: 0 }}
      >
        {/* Header */}
        <div className="h-[60px] flex items-center justify-between px-4 border-b border-[color:var(--border)] shrink-0">
          <BrandLockup size="sm" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Collapse navigation"
            title="Collapse navigation"
            className="w-7 h-7 flex cursor-pointer items-center justify-center rounded-md text-[color:var(--foreground-muted)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--foreground)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace context */}
        {workspaceName && (
          <div className="px-4 py-3 border-b border-[color:var(--border)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-muted)]">
              Workspace
            </p>
            <p className="text-sm font-semibold text-[color:var(--foreground)] mt-0.5 truncate leading-snug">
              {workspaceName}
            </p>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5" aria-label="Workspace navigation">
          {navigation.map(({ name, href, icon: Icon }) => (
            <NavLink
              key={name}
              to={href}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-[color:var(--primary-soft)] text-[color:var(--primary)]"
                    : "text-[color:var(--foreground-secondary)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--foreground)]",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "stroke-[2.2]" : "stroke-[1.8]"}`} />
                  {name}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Exit */}
        <div className="p-2 border-t border-[color:var(--border)]">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[color:var(--foreground-muted)] hover:bg-[color:var(--danger-soft)] hover:text-[color:var(--danger)] transition-all duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Exit Workspace
          </NavLink>
        </div>
      </div>
    </>
  );
}
