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
    if (busy) {
      return;
    }

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
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-2 py-1.5 text-left shadow-sm transition-colors hover:border-[color:var(--accent)] focus:outline-none">
        <Avatar className="size-8">
          <AvatarFallback className="bg-[color:var(--accent)] text-white text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-medium text-[color:var(--text-primary)]">{user?.name || "Account"}</p>
          <p className="truncate text-xs text-[color:var(--text-secondary)]">{user?.email || "Signed in"}</p>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-[color:var(--accent)] text-white text-sm font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{user?.name || "Account"}</p>
              <p className="truncate text-xs text-[color:var(--text-secondary)]">{user?.email || "Signed in"}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 px-3 py-2 text-sm text-[color:var(--text-primary)]">
          <UserCircle2 className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 px-3 py-2 text-sm text-[color:var(--danger)]"
          onSelect={(event) => {
            event.preventDefault();
            handleLogout();
          }}
        >
          <LogOut className="h-4 w-4" />
          {busy ? "Logging out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}