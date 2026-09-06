"use client";

import { useState } from "react";
import Link from "next/link";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register") {
      setRegisteredEmail("hello@agency.com");
    }
  };

  return (
    <main className="mx-auto max-w-5xl rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] bg-stone-900 p-8 text-white">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-300">Welcome back</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Build trust in every transaction.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-stone-300">
            Buy and sell with secure checkout, verified profiles, and a courier network designed for smooth delivery.
          </p>

          <div className="mt-8 space-y-4 text-sm text-stone-200">
            {[
              "Identity verification for sellers and buyers",
              "Protected payments and reservation flow",
              "Parcel tracking from checkout to delivery",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-stone-900">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-stone-200 bg-stone-50 p-6">
          <div className="inline-flex w-full rounded-full border border-stone-200 bg-white p-1">
            <button
              type="button"
              onClick={() => { setMode("login"); setRegisteredEmail(null); }}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "login" ? "bg-stone-900 text-white" : "text-stone-600"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setRegisteredEmail(null); }}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "register" ? "bg-stone-900 text-white" : "text-stone-600"
              }`}
            >
              Register
            </button>
          </div>

          {registeredEmail && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Account created successfully!</p>
              <p className="mt-1 text-emerald-800">
                We sent a verification link to <span className="font-medium">{registeredEmail}</span>.
              </p>
              <Link href="/auth/verify-email" className="mt-2 inline-block font-medium text-emerald-900 underline">
                Verify Email Address →
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-stone-700">
                  <span className="mb-2 block">First name</span>
                  <input className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 outline-none transition focus:border-stone-400" defaultValue="Amina" />
                </label>
                <label className="block text-sm text-stone-700">
                  <span className="mb-2 block">Last name</span>
                  <input className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 outline-none transition focus:border-stone-400" defaultValue="Farah" />
                </label>
              </div>
            )}

            <label className="block text-sm text-stone-700">
              <span className="mb-2 block">Email</span>
              <input type="email" className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 outline-none transition focus:border-stone-400" defaultValue="hello@agency.com" />
            </label>

            <label className="block text-sm text-stone-700">
              <div className="mb-2 flex items-center justify-between">
                <span>Password</span>
                {mode === "login" && (
                  <Link href="/auth/forgot-password" className="text-xs font-medium text-stone-600 hover:text-stone-900">
                    Forgot password?
                  </Link>
                )}
              </div>
              <input type="password" className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 outline-none transition focus:border-stone-400" defaultValue="Password123!" />
            </label>

            {mode === "register" && (
              <label className="block text-sm text-stone-700">
                <span className="mb-2 block">Phone number</span>
                <input className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5 outline-none transition focus:border-stone-400" defaultValue="+971 50 123 4567" />
              </label>
            )}

            <button type="submit" className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-700">
              {mode === "login" ? "Log in to your account" : "Create account"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm text-stone-500">
            <span>{mode === "login" ? "Need an account?" : "Already have an account?"}</span>
            <button type="button" className="font-medium text-stone-900" onClick={() => { setMode(mode === "login" ? "register" : "login"); setRegisteredEmail(null); }}>
              {mode === "login" ? "Register now" : "Log in"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
