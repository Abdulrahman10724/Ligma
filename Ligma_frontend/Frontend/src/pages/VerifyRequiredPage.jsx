import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MailWarning, RefreshCw } from "lucide-react";

import { BrandLockup } from "../components/ui/BrandMark";
import { resendVerificationEmail, clearAuthState, bootstrapAuth } from "../redux/authSlice";
export default function VerifyRequiredPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
const { user, isAuthenticated, verificationLoading, verificationMessage } = useSelector((state) => state.auth);
  const [feedback, setFeedback] = useState(verificationMessage || "");

  useEffect(() => {
    setFeedback(verificationMessage || "");
  }, [verificationMessage]);
  // Agar email kisi doosri tab/device pe already verify ho chuki hai — auto redirect
useEffect(() => {
  if (isAuthenticated && user?.emailVerified) {
    navigate("/dashboard", { replace: true });
  }
}, [isAuthenticated, user?.emailVerified, navigate]);

// Har 5 second baad session refresh karo taake doosri tab mein verify hone ka pata chal jaye
useEffect(() => {
  if (!isAuthenticated || user?.emailVerified) return undefined;
  const interval = setInterval(() => {
    dispatch(bootstrapAuth());
  }, 5000);
  return () => clearInterval(interval);
}, [dispatch, isAuthenticated, user?.emailVerified]);

  const handleResend = async () => {
    const result = await dispatch(resendVerificationEmail());
    if (resendVerificationEmail.fulfilled.match(result)) {
      setFeedback("Verification email sent. Please check your inbox.");
      return;
    }

setFeedback(result.payload?.message || "We couldn't send another verification email. Please try again shortly.");  };

  const email = location.state?.email || user?.email || "your inbox";

  return (
    <div className="min-h-screen bg-[color:var(--background)] px-4 py-10 text-[color:var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 rounded-[32px] border border-[color:var(--border)] bg-[color:var(--surface)]/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.06)] backdrop-blur sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
        <div className="max-w-xl space-y-6">
          <BrandLockup size="lg" />
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">Verify your email</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
              One more step before you continue
            </h1>
            <p className="text-sm leading-7 text-[color:var(--foreground-muted)] sm:text-base">
              We sent a verification link to {email}. Open it to unlock the rest of LIGMA.
            </p>
          </div>
        </div>

        <div className="w-full max-w-lg rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]/80 p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <MailWarning className="h-8 w-8 text-[color:var(--primary)]" />
            <div>
              <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Check your inbox</h2>
              <p className="text-sm text-[color:var(--foreground-muted)]">We’ll keep this screen simple while you verify.</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/70 p-4 text-sm text-[color:var(--foreground-secondary)]">
            <p className="font-medium text-[color:var(--foreground)]">Email address</p>
            <p className="mt-1 break-all">{email}</p>
          </div>

          {feedback && (
            <div className="mt-4 rounded-xl border border-[color:var(--primary)]/20 bg-[color:var(--primary)]/10 px-3 py-3 text-sm text-[color:var(--foreground)]">
              {feedback}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleResend}
              disabled={verificationLoading}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] transition hover:bg-[color:var(--primary-hover)] disabled:opacity-60"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {verificationLoading ? "Sending…" : "Resend verification email"}
            </button>
            <button
              type="button"
              onClick={() => {
    dispatch(clearAuthState());
    navigate("/login", { replace: true });
              }}
              className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
            >
              Back to sign in
            </button>
          </div>

          <p className="mt-6 text-xs leading-6 text-[color:var(--foreground-muted)]">
            If you already verified your email, return to sign in and continue. We’ll keep your account secure and only allow access after verification.
          </p>
        </div>
      </div>
    </div>
  );
}
