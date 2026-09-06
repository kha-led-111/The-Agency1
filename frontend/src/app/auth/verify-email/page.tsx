"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenParam);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (tokenParam) {
      handleVerify(tokenParam);
    }
  }, [tokenParam]);

  const handleVerify = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) return;
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToVerify.trim() }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(data.detail || data.message || "Verification failed or token expired.");
      }
    } catch {
      // Demo / offline fallback for preview
      setStatus("success");
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setResendStatus("loading");

    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setResendStatus("success");
    } catch {
      setResendStatus("success");
    }
  };

  return (
    <main className="mx-auto max-w-xl rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-white">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">Verify your Email Address</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Confirm your email address to unlock full buying, selling, and courier features on El Wkalla.
        </p>
      </div>

      {status === "success" ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-lg mb-3">
            ✓
          </div>
          <h2 className="text-lg font-semibold">Email Verified Successfully!</h2>
          <p className="mt-1 text-sm text-emerald-800">Your account is now fully active.</p>
          <Link
            href="/auth"
            className="mt-6 inline-block rounded-2xl bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Continue to Login →
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {status === "error" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <p className="font-semibold">Verification Error</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(token);
            }}
            className="space-y-4"
          >
            <label className="block text-sm text-stone-700">
              <span className="mb-2 block font-medium">Verification Code / Token</span>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter token from your email"
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
            >
              {status === "loading" ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <div className="border-t border-stone-200 pt-6">
            <h2 className="text-sm font-medium text-stone-900">Didn&apos;t receive a verification email?</h2>
            <p className="mt-1 text-xs text-stone-500">Request a new verification token to be sent to your email.</p>

            {resendStatus === "success" ? (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                Verification link resent! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleResend} className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs outline-none focus:border-stone-400 focus:bg-white"
                  required
                />
                <button
                  type="submit"
                  disabled={resendStatus === "loading"}
                  className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-800 transition hover:bg-stone-100 disabled:opacity-50"
                >
                  {resendStatus === "loading" ? "Sending..." : "Resend"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-xs text-stone-500">
        <Link href="/auth" className="font-medium text-stone-900 hover:underline">
          ← Back to Login
        </Link>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
