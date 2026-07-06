import React from "react";
import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] text-[color:var(--text-primary)]">
      <div className="w-full max-w-md p-8 bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-[color:var(--accent)]">Welcome to LIGMA</h2>
        <p className="text-sm text-center mb-6 text-[color:var(--text-secondary)]">Sign in to your account</p>
        <div className="flex flex-col gap-4">
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full p-3 border border-[color:var(--border)] bg-[color:var(--bg-primary)] rounded-md focus:outline-none focus:border-[color:var(--accent)]"
            disabled
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border border-[color:var(--border)] bg-[color:var(--bg-primary)] rounded-md focus:outline-none focus:border-[color:var(--accent)]"
            disabled
          />
          <button className="w-full py-3 bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-medium rounded-md transition-colors duration-150">
            Sign In (Phase 2)
          </button>
        </div>
        <p className="mt-4 text-xs text-center text-[color:var(--text-secondary)]">
          Don't have an account? <Link to="/register" className="text-[color:var(--accent)] font-semibold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
