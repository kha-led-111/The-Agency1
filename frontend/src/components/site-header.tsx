import Link from "next/link";

const navItems = [
  { label: "الرئيسية", href: "/" },
  { label: "تصفح المنتجات", href: "/browse" },
  { label: "استوديو البائع", href: "/seller" },
  { label: "طلباتي", href: "/orders" },
  { label: "الملف الشخصي", href: "/profile" },
  { label: "لوحة التحكم", href: "/admin" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-sm font-bold text-white shadow-sm">
            و
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-stone-900">الوكالة</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-semibold">El Wkalla</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-stone-600 md:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-stone-900 font-semibold">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/seller/create-listing" className="hidden rounded-full border border-amber-300 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-500/20 sm:inline-flex">
            + إضافة إعلان جديد
          </Link>
          <Link href="/auth" className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 transition hover:border-stone-400">
            حسابي
          </Link>
        </div>
      </div>
    </header>
  );
}
