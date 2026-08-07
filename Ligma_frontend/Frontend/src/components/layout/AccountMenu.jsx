import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LogOut, UserCircle2 } from "lucide-react";

import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import ThemeToggle from "../ui/ThemeToggle";
import { logoutUser, clearAuthState } from "../../redux/authSlice";

export default function AccountMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [busy, setBusy] = useState(false);

  const initials = (user?.name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await dispatch(logoutUser()).unwrap();
    } finally {
      dispatch(clearAuthState());
      navigate("/login", { replace: true });
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1.5 text-left transition-colors hover:border-[color:var(--primary)]/50 focus:outline-none">
        <Avatar className="size-7">
          <AvatarFallback className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-xs font-medium text-[color:var(--foreground)] max-w-28">{user?.name || "Account"}</p>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">{user?.name || "Account"}</p>
              <p className="truncate text-xs text-[color:var(--foreground-muted)]">{user?.email || "Signed in"}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Theme toggle inside menu */}
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--foreground-muted)] mb-2">Appearance</p>
          <ThemeToggle variant="segment" />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="gap-2 px-3 py-2 text-sm text-[color:var(--foreground)] hover:bg-[color:var(--surface-hover)]">
          <UserCircle2 className="h-4 w-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2 px-3 py-2 text-sm text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)]"
          onSelect={(event) => {
            event.preventDefault();
            handleLogout();
          }}
        >
          <LogOut className="h-4 w-4" />
          {busy ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}