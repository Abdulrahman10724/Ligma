import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, bootstrapping, user } = useSelector((state) => state.auth);

  if (bootstrapping) {
    return (
      <div className="min-h-screen grid place-items-center bg-[color:var(--bg-primary)] text-[color:var(--text-secondary)]">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user?.emailVerified) {
    return <Navigate to="/verify-required" state={{ from: location, email: user?.email }} replace />;
  }

  return children;
}