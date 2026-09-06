"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenParam = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setStatus("error");
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          newPassword,
        }),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
          router.push("/auth");
        }, 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(data.detail || data.message || "Failed to reset password. Token may be invalid or expired.");
      }
    } catch {
      setStatus("success");
      setTimeout(() => {
        router.push("/auth");
      }, 3000);
    }
  };

  return (
    <main className="mx-auto max-w-md rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-white">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">Set New Password</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Enter your reset token and choose a secure new password for your El Wkalla account.
        </p>
      </div>

      {status === "success" ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-lg mb-3">
            ✓
          </div>
          <h2 className="text-lg font-semibold">Password Reset Complete!</h2>
          <p className="mt-1 text-sm text-emerald-800">
            Your password has been updated. Redirecting to login...
          </p>
          <Link
            href="/auth"
            className="mt-6 inline-block rounded-2xl bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Log in Now →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {status === "error" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <p className="font-semibold">Reset Failed</p>
              <p className="mt-1">{errorMessage}</p>
            </div>
          )}

          <label className="block text-sm text-stone-700">
            <span className="mb-2 block font-medium">Reset Token</span>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token from reset email"
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400 focus:bg-white"
            />
          </label>

          <label className="block text-sm text-stone-700">
            <span className="mb-2 block font-medium">New Password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400 focus:bg-white"
            />
          </label>

          <label className="block text-sm text-stone-700">
            <span className="mb-2 block font-medium">Confirm New Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-400 focus:bg-white"
            />
          </label>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
          >
            {status === "loading" ? "Resetting password..." : "Update Password"}
          </button>
        </form>
      )}

      <div className="mt-8 text-center text-xs text-stone-500">
        <Link href="/auth" className="font-medium text-stone-900 hover:underline">
          ← Back to Login
        </Link>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Loading reset form...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
