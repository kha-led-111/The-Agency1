import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "الوكالة — سوق النخبة المستدام",
  description: "المنصة الأكثر أماناً لبيع وشراء القطع المميزة والتوصيل الفوري مع الدفع عند الاستلام.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-stone-50 text-stone-900 font-sans antialiased">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© 2026 منصة الوكالة (El Wkalla). جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-6">
              <span>الأمان وحماية المشتري</span>
              <span>شبكة التوصيل السريع</span>
              <span>الدفع عند الاستلام</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
