"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  useEffect(() => {
    if (redirectParam) {
      router.replace(`/auth?redirect=${encodeURIComponent(redirectParam)}`);
    } else {
      router.replace("/auth");
    }
  }, [redirectParam, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-stone-500 font-bold text-sm">
      جاري إعادة التوجيه إلى صفحة تسجيل الدخول...
    </div>
  );
}

export default function LoginRedirectPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500 font-medium">جاري التحميل...</div>}>
      <LoginRedirectContent />
    </Suspense>
  );
}
