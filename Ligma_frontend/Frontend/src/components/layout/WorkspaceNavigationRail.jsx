import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import BrandMark from "../ui/BrandMark";
/**
 * WorkspaceNavigationRail — slim 60px icon-only navigation rail.
 *
 * Props:
 *   navigation  — array of { name, href, icon: Component }
 *   workspaceId — used for exit href
 *   isExpanded  — controlled from parent (WorkspacePage)
 *   onToggle    — callback to toggle expansion
 */
export default function WorkspaceNavigationRail({
  navigation,
  isExpanded,
  onToggle,
}) {
  return (
    <div
      className="relative z-50 flex flex-col h-full"
      style={{ width: "60px", flexShrink: 0 }}
    >
      {/* Rail container */}
      <div className="flex flex-col h-full bg-[color:var(--surface)] border-r border-[color:var(--border)]">
        {/* Brand mark + collapse toggle */}
        <button
          type="button"
          onClick={onToggle}
          title={isExpanded ? "Collapse navigation" : "Expand navigation"}
          aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
          className="h-[60px] w-full flex cursor-pointer items-center justify-center border-b border-[color:var(--border)] hover:bg-[color:var(--surface-hover)] transition-colors duration-150 shrink-0 text-[color:var(--primary)]"
        >
          <BrandMark size="sm" className="text-[color:var(--primary)]" />{" "}
        </button>

        {/* Navigation items */}
        <nav
          className="flex-1 flex flex-col items-center py-2 gap-0.5"
          aria-label="Workspace navigation"
        >
          {navigation.map(({ name, href, icon: Icon }) => (
            <NavLink
              key={name}
              to={href}
              className={({ isActive }) =>
                [
                  "nav-rail-item relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150",
                  isActive
                    ? "bg-[color:var(--primary-soft)] text-[color:var(--primary)]"
                    : "text-[color:var(--foreground-muted)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--foreground)]",
                ].join(" ")
              }
              title={name}
              aria-label={name}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 ${isActive ? "stroke-[2.2]" : "stroke-[1.8]"}`}
                  />
                  <span className="nav-tooltip">{name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Exit workspace */}
        <div className="pb-3 flex flex-col items-center gap-0.5 border-t border-[color:var(--border)] pt-2">
          <NavLink
            to="/dashboard"
            className="nav-rail-item relative flex items-center justify-center w-10 h-10 rounded-lg text-[color:var(--foreground-muted)] hover:bg-[color:var(--danger-soft)] hover:text-[color:var(--danger)] transition-all duration-150"
            title="Exit Workspace"
            aria-label="Exit Workspace"
          >
            <LogOut className="w-4 h-4" />
            <span className="nav-tooltip">Exit Workspace</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
