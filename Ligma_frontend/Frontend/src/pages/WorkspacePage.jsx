import React from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { LayoutDashboard, Milestone, MessageSquare, Users, History, Settings, LogOut } from "lucide-react";

export default function WorkspacePage() {
  const { id } = useParams();

  const navigation = [
    { name: "Canvas", href: `/workspace/${id}/canvas`, icon: LayoutDashboard },
    { name: "Tasks", href: `/workspace/${id}/tasks`, icon: Milestone },
    { name: "Chat", href: `/workspace/${id}/chat`, icon: MessageSquare },
    { name: "Members", href: `/workspace/${id}/members`, icon: Users },
    { name: "History", href: `/workspace/${id}/history`, icon: History },
    { name: "Settings", href: `/workspace/${id}/settings`, icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[color:var(--bg-primary)] text-[color:var(--text-primary)] overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-60 bg-[color:var(--bg-surface)] border-r border-[color:var(--border)] flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-[color:var(--border)]">
            <span className="text-xl font-black text-[color:var(--accent)] tracking-wider">LIGMA</span>
          </div>
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-[color:var(--bg-primary)] text-[color:var(--accent)] border-l-4 border-[color:var(--accent)]"
                        : "text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-primary)] hover:text-[color:var(--text-primary)]"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-[color:var(--border)]">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-primary)] hover:text-red-500 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Exit Workspace
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-[color:var(--bg-surface)] border-b border-[color:var(--border)] flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-[color:var(--text-secondary)]">Workspace ID: {id}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[color:var(--accent)] text-white flex items-center justify-center font-bold text-sm">
              AR
            </span>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-auto relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
