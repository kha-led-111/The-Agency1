"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitial = () => {
    if (!user) return "ح";
    if (user.firstName && user.firstName.length > 0) {
      return user.firstName[0].toUpperCase();
    }
    if (user.email && user.email.length > 0) {
      return user.email[0].toUpperCase();
    }
    return "ح";
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

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

        {/* Action Buttons & Avatar Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={isAuthenticated ? "/seller/create-listing" : "/auth?returnUrl=/seller/create-listing"}
            className="hidden rounded-full border border-amber-300 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-500/20 sm:inline-flex"
          >
            + إضافة إعلان جديد
          </Link>

          {isAuthenticated && user ? (
            /* User Avatar Navigation Dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 p-1.5 pr-3 text-xs font-bold text-stone-800 transition hover:border-stone-300 hover:bg-stone-100 shadow-sm"
                aria-expanded={dropdownOpen}
                aria-label="قائمة المستخدم"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-amber-300 shadow-inner">
                  {getInitial()}
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate">
                  {user.firstName || user.email.split("@")[0]}
                </span>
                <svg
                  className={`h-4 w-4 text-stone-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu Modal */}
              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Profile Card Header */}
                  <div className="border-b border-stone-100 px-3 py-2.5">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate font-medium dir-ltr text-right">{user.email}</p>
                    <span className="mt-1.5 inline-block rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                      {isAdmin ? "مسؤول" : user.role === "Seller" ? "بائع" : "مشتري"}
                    </span>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-100 hover:text-stone-900"
                    >
                      <svg className="h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>الملف الشخصي</span>
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-100 hover:text-stone-900"
                    >
                      <svg className="h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>طلباتي</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 bg-amber-500/10 transition hover:bg-amber-500/20"
                      >
                        <svg className="h-4 w-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>لوحة التحكم</span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-stone-100 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 hover:text-rose-800"
                    >
                      <svg className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="rounded-full border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-bold text-stone-800 transition hover:border-stone-400 hover:bg-white sm:px-4"
            >
              تسجيل الدخول
            </Link>
          )}

          {/* Mobile Hamburger Toggle */}
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

            <div className="mt-3 pt-3 border-t border-stone-200 space-y-2">
              <Link
                href={isAuthenticated ? "/seller/create-listing" : "/auth?returnUrl=/seller/create-listing"}
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-xl border border-amber-300 bg-amber-400/20 px-4 py-3 text-sm font-bold text-amber-900 transition hover:bg-amber-400/30"
              >
                + إضافة إعلان جديد
              </Link>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 transition hover:bg-rose-100"
                >
                  تسجيل الخروج
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
