import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AlertTriangle, CheckCircle2, LoaderCircle, MailCheck, RefreshCw } from "lucide-react";

import { BrandLockup } from "../components/ui/BrandMark";
import { resendVerificationEmail, verifyEmailUser } from "../redux/authSlice";

export default function VerifyEmailPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { user, verificationLoading, verificationState, verificationMessage } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token) {
      return;
    }

    dispatch(verifyEmailUser(token));
  }, [dispatch, token]);

  const handleResend = async () => {
    const result = await dispatch(resendVerificationEmail());
    if (resendVerificationEmail.fulfilled.match(result)) {
      navigate("/verify-required", { replace: true, state: { email: user?.email } });
    }
  };

  const renderContent = () => {
    if (verificationLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]/80 p-8 shadow-sm">
          <LoaderCircle className="h-10 w-10 animate-spin text-[color:var(--primary)]" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Verifying your email…</h2>
            <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">Please wait while we confirm your address.</p>
          </div>
        </div>
      );
    }

    if (verificationState === "success" || verificationState === "already-verified") {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-8 shadow-sm">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Email verified successfully</h2>
            <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
              {verificationMessage || "You can continue into LIGMA and start working with your team."}
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] transition hover:bg-[color:var(--primary-hover)]"
          >
            Continue to LIGMA
          </Link>
        </div>
      );
    }

    if (verificationState === "expired") {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]/80 p-8 shadow-sm">
          <AlertTriangle className="h-10 w-10 text-[color:var(--warning)]" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">This verification link has expired</h2>
            <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
              {verificationMessage || "Request a fresh link below and we’ll send it to your inbox."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResend}
            disabled={verificationLoading}
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)] disabled:opacity-60"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Resend verification email
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]/80 p-8 shadow-sm">
        <MailCheck className="h-10 w-10 text-[color:var(--primary)]" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[color:var(--foreground)]">This link is no longer usable</h2>
          <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
            {verificationMessage || "The verification link may have already been used or is invalid. Request a new one to continue."}
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleResend}
            disabled={verificationLoading}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] transition hover:bg-[color:var(--primary-hover)] disabled:opacity-60"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Resend verification email
          </button>
          <Link to="/login" className="text-sm font-semibold text-[color:var(--primary)] hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)] px-4 py-10 text-[color:var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-[32px] border border-[color:var(--border)] bg-[color:var(--surface)]/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.06)] backdrop-blur sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
        <div className="max-w-xl space-y-6">
          <BrandLockup size="lg" />
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--primary)]">Email verification</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
              Finish securing your LIGMA workspace
            </h1>
            <p className="text-sm leading-7 text-[color:var(--foreground-muted)] sm:text-base">
              Confirm your inbox, verify your address, and continue into your team’s workspace with confidence.
            </p>
          </div>
          {user?.email && (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/70 p-4 text-sm text-[color:var(--foreground-secondary)]">
              <p className="font-medium text-[color:var(--foreground)]">Signed in as</p>
              <p className="mt-1 break-all">{user.email}</p>
            </div>
          )}
        </div>

        <div className="w-full max-w-lg">{renderContent()}</div>
      </div>
    </div>
  );
}
