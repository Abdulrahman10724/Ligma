import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandLockup } from "../components/ui/BrandMark";
import { registerUser } from "../redux/authSlice";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long"),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated, error } = useSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values) => {
    const result = await dispatch(registerUser(values));
    if (registerUser.fulfilled.match(result)) {
      navigate("/verify-required", { replace: true, state: { email: values.email } });
    }
  };

  return (
    <div className="min-h-screen flex bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* ── Left decorative panel ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[56%] flex-col justify-between p-12 bg-[color:var(--surface)] border-r border-[color:var(--border)] relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 600 700" fill="none" aria-hidden="true">
          <circle cx="150" cy="300" r="200" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="450" cy="400" r="160" stroke="currentColor" strokeWidth="0.8" />
          <line x1="0" y1="350" x2="600" y2="350" stroke="currentColor" strokeWidth="0.5" />
          <line x1="300" y1="0" x2="300" y2="700" stroke="currentColor" strokeWidth="0.5" />
          <rect x="80" y="120" width="440" height="460" rx="8" stroke="currentColor" strokeWidth="0.5" />
          <polygon points="300,50 550,650 50,650" stroke="currentColor" strokeWidth="0.4" fill="none" />
        </svg>

        <div className="relative">
          <BrandLockup size="lg" />
        </div>

        <div className="relative space-y-5">
          <h2 className="text-4xl font-black leading-[1.1] tracking-tight text-[color:var(--foreground)]">
            Build together,<br />
            <span className="text-[color:var(--primary)]">think clearly.</span>
          </h2>
          <p className="text-sm text-[color:var(--foreground-secondary)] max-w-xs leading-relaxed">
            Join LIGMA and collaborate in real time on an infinite canvas. Invite your team, assign roles, and track every decision.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: "Infinite canvas", desc: "Draw, plan, annotate" },
              { label: "Real-time sync", desc: "See every cursor live" },
              { label: "AI extraction", desc: "Tasks & decisions" },
              { label: "Full audit log", desc: "Time-travel replay" },
            ].map(({ label, desc }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-[color:var(--foreground)]">{label}</span>
                <span className="text-xs text-[color:var(--foreground-muted)]">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-[color:var(--foreground-muted)]">LIGMA © {new Date().getFullYear()}</p>
      </div>

      {/* ── Right auth panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-10 lg:hidden">
          <BrandLockup size="md" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[color:var(--foreground)]">Create your account</h1>
            <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">Free to start. No credit card required.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-[color:var(--danger)]/30 bg-[color:var(--danger-soft)] px-3.5 py-3 text-sm text-[color:var(--danger)]">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--foreground-secondary)] mb-1.5">Full name</label>
              <input
                type="text"
                placeholder="Alex Kim"
                autoComplete="name"
                className="w-full h-10 px-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground-muted)] outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--focus-ring)] transition-all disabled:opacity-50"
                disabled={loading}
                {...register("name")}
              />
              {errors.name && <p className="mt-1.5 text-xs text-[color:var(--danger)]">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[color:var(--foreground-secondary)] mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full h-10 px-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground-muted)] outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--focus-ring)] transition-all disabled:opacity-50"
                disabled={loading}
                {...register("email")}
              />
              {errors.email && <p className="mt-1.5 text-xs text-[color:var(--danger)]">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[color:var(--foreground-secondary)] mb-1.5">Password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="w-full h-10 px-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground-muted)] outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--focus-ring)] transition-all disabled:opacity-50"
                disabled={loading}
                {...register("password")}
              />
              {errors.password && <p className="mt-1.5 text-xs text-[color:var(--danger)]">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-sm font-semibold hover:bg-[color:var(--primary-hover)] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-[color:var(--foreground-muted)]">
            Already have an account?{" "}
            <Link to="/login" className="text-[color:var(--primary)] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
