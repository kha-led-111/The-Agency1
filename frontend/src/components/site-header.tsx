"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthRole } from "@/lib/auth";

const allNavItems = [
  { label: "الرئيسية", href: "/" },
  { label: "تصفح المنتجات", href: "/browse" },
  { label: "استوديو البائع", href: "/seller" },
  { label: "طلباتي", href: "/orders" },
  { label: "الملف الشخصي", href: "/profile" },
  { label: "لوحة التحكم", href: "/admin", adminOnly: true },
];

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin } = useAuthRole();

  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-6 lg:px-8 sm:py-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-sm font-bold text-white shadow-sm">
            و
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-stone-900 leading-tight">الوكالة</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">El Wkalla</div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-stone-600 md:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-stone-900 font-semibold">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Action Buttons & Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/seller/create-listing"
            className="hidden rounded-full border border-amber-300 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-500/20 sm:inline-flex"
          >
            + إضافة إعلان جديد
          </Link>
          <Link
            href="/auth"
            className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-white sm:px-4"
          >
            حسابي
          </Link>

          {/* Mobile Hamburger Toggle (44px min touch target) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100 md:hidden"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-stone-200 bg-stone-50 p-4 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-200/70"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-3 pt-3 border-t border-stone-200">
              <Link
                href="/seller/create-listing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-xl border border-amber-300 bg-amber-400/20 px-4 py-3 text-sm font-bold text-amber-900 transition hover:bg-amber-400/30"
              >
                + إضافة إعلان جديد
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
