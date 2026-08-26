import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandLockup } from "../components/ui/BrandMark";
import { loginUser } from "../redux/authSlice";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "/dashboard";
  const { loading, isAuthenticated, error, user } = useSelector(
    (state) => state.auth,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated && user?.emailVerified) {
      navigate(from, { replace: true });
    } else if (isAuthenticated && user && !user.emailVerified) {
      navigate("/verify-required", {
        replace: true,
        state: { email: user.email },
      });
    }
  }, [isAuthenticated, user, navigate, from]);
  const onSubmit = async (values) => {
    const result = await dispatch(loginUser(values));
   if (loginUser.fulfilled.match(result)) {
  navigate(from, { replace: true });
}

    if (loginUser.rejected.match(result) && result.payload?.status === 403) {
      navigate("/verify-required", {
        replace: true,
        state: { email: values.email },
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* ── Left decorative panel ────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[56%] flex-col justify-between p-12 bg-[color:var(--surface)] border-r border-[color:var(--border)] relative overflow-hidden">
        {/* Geometric SVG background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04]"
          viewBox="0 0 600 700"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="300"
            cy="200"
            r="180"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle
            cx="300"
            cy="200"
            r="100"
            stroke="currentColor"
            strokeWidth="0.6"
          />
          <line
            x1="0"
            y1="200"
            x2="600"
            y2="200"
            stroke="currentColor"
            strokeWidth="0.6"
          />
          <line
            x1="300"
            y1="0"
            x2="300"
            y2="700"
            stroke="currentColor"
            strokeWidth="0.6"
          />
          <line
            x1="0"
            y1="0"
            x2="600"
            y2="400"
            stroke="currentColor"
            strokeWidth="0.4"
          />
          <line
            x1="600"
            y1="0"
            x2="0"
            y2="400"
            stroke="currentColor"
            strokeWidth="0.4"
          />
          <rect
            x="140"
            y="80"
            width="320"
            height="240"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <circle
            cx="420"
            cy="500"
            r="120"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <circle
            cx="100"
            cy="550"
            r="80"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </svg>

        {/* Brand */}
        <div className="relative">
          <BrandLockup size="lg" />
        </div>

        {/* Copy */}
        <div className="relative space-y-5">
          <h2 className="text-4xl font-black leading-[1.1] tracking-tight text-[color:var(--foreground)]">
            Editorial
            <br />
            <span className="text-[color:var(--primary)]">productivity</span>
            <br />
            meets canvas.
          </h2>
          <p className="text-sm text-[color:var(--foreground-secondary)] max-w-xs leading-relaxed">
            A professional workspace for teams that think visually. Real-time
            collaboration, AI classification, and a full audit history.
          </p>
          <div className="flex items-center gap-6 pt-2">
            {["Canvas", "Tasks", "Chat", "History"].map((feat) => (
              <div key={feat} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--primary)]" />
                <span className="text-xs font-medium text-[color:var(--foreground-muted)]">
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-[color:var(--foreground-muted)]">
          Scrybe © {new Date().getFullYear()}
        </p>
      </div>

      {/* ── Right auth panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile brand */}
        <div className="mb-10 lg:hidden">
          <BrandLockup size="md" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">
              Sign in to your account to continue.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-[color:var(--danger)]/30 bg-[color:var(--danger-soft)] px-3.5 py-3 text-sm text-[color:var(--danger)]">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--foreground-secondary)] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full h-10 px-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground-muted)] outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--focus-ring)] transition-all disabled:opacity-50"
                disabled={loading}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-[color:var(--danger)]">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[color:var(--foreground-secondary)] mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-10 px-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground-muted)] outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--focus-ring)] transition-all disabled:opacity-50"
                disabled={loading}
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-[color:var(--danger)]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-sm font-semibold hover:bg-[color:var(--primary-hover)] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-[color:var(--foreground-muted)]">
            No account?{" "}
            <Link
              to="/register"
              className="text-[color:var(--primary)] font-semibold hover:underline"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
