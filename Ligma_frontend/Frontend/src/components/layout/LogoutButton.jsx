import  { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { Button } from "../ui/button";
import { clearAuthState, logoutUser } from "../../redux/authSlice";

export default function LogoutButton() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

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
    <Button variant="ghost" className="gap-2 text-[color:var(--text-secondary)] hover:text-[color:var(--danger)]" onClick={handleLogout} disabled={busy}>
      <LogOut className="h-4 w-4" />
      {busy ? "Logging out..." : "Logout"}
    </Button>
  );
}