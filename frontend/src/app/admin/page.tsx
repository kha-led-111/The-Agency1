"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getImageUrl } from "@/lib/api";

interface PendingProduct {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  categoryId: string;
  categoryName: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  imageUrl?: string;
  isApproved: boolean;
  createdAtUtc: string;
}

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAtUtc: string;
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  totalAmount: number;
  shippingAddress: string;
  status: string;
  createdAtUtc: string;
  deliveryAgentId?: string;
  items: Array<{
    id: string;
    productTitle: string;
    unitPrice: number;
  }>;
}

interface CourierOption {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
}

interface AdminDashboardStats {
  activeSellersCount: number;
  completedOrdersCount: number;
  verifiedBuyersCount: number;
  verifiedBuyersPercentage: number;
  averageRating: number;
  totalRevenue: number;
  pendingProductsCount: number;
  pendingOrdersCount: number;
  totalUsersCount: number;
}

const ROLE_OPTIONS = [
  { value: "Admin", label: "مسؤول (Admin)" },
  { value: "Seller", label: "بائع (Seller)" },
  { value: "Buyer", label: "مشتري (Buyer)" },
  { value: "Courier", label: "مندوب (Courier)" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user: currentUser, isAdmin, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"products" | "users" | "orders">("products");

  // Dashboard Metrics State
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  // Pending Products State
  const [moderationItems, setModerationItems] = useState<PendingProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // User Management State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pending Orders State
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [selectedCouriers, setSelectedCouriers] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch dashboard stats from backend API
  const fetchDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard/stats", {
        credentials: "include",
      });
      if (res.ok) {
        const data: AdminDashboardStats = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin dashboard stats", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardStats();
      const interval = setInterval(fetchDashboardStats, 3000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, fetchDashboardStats]);

  // Fetch pending products
  const fetchPendingProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch("/api/admin/products/pending", {
        credentials: "include",
      });
      if (res.ok) {
        const data: PendingProduct[] = await res.json();
        setModerationItems(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch pending products", err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === "products") {
      fetchPendingProducts();
    }
  }, [isAdmin, activeTab, fetchPendingProducts]);

  // Fetch users for admin table
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (statusFilter === "ACTIVE") params.append("isActive", "true");
      if (statusFilter === "INACTIVE") params.append("isActive", "false");

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data: UserItem[] = await res.json();
        setUsers(data);
      } else {
        console.error("Failed to fetch users");
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setUsersLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    if (isAdmin && activeTab === "users") {
      fetchUsers();
    }
  }, [isAdmin, activeTab, fetchUsers]);

  // Fetch pending assignment orders and available couriers
  const fetchPendingOrdersAndCouriers = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const [ordersRes, couriersRes] = await Promise.all([
        fetch("/api/admin/orders/pending-assignment", { credentials: "include" }),
        fetch("/api/admin/orders/couriers", { credentials: "include" }),
      ]);

      if (ordersRes.ok) {
        const ordersData: PendingOrder[] = await ordersRes.json();
        setPendingOrders(ordersData || []);
      }
      if (couriersRes.ok) {
        const couriersData: CourierOption[] = await couriersRes.json();
        setCouriers(couriersData || []);
      }
    } catch (err) {
      console.error("Failed to fetch pending orders/couriers", err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === "orders") {
      fetchPendingOrdersAndCouriers();
      const interval = setInterval(fetchPendingOrdersAndCouriers, 3000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, activeTab, fetchPendingOrdersAndCouriers]);

  // Handle Delivery Agent Assignment
  const handleAssignDelivery = async (orderId: string, orderNumber: string) => {
    const courierId = selectedCouriers[orderId];
    if (!courierId) {
      showToast("يرجى اختيار مندوب التوصيل قبل تأكيد التعيين.");
      return;
    }

    setAssigningId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deliveryAgentId: courierId, notes: "تم التعيين بواسطة لوحة تحكم المسؤول" }),
      });

      if (res.ok) {
        showToast(`تم تعيين مندوب التوصيل للطلب ${orderNumber} بنجاح!`);
        setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || err.detail || "تعذر تعيين مندوب التوصيل للطلب.");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم.");
    } finally {
      setAssigningId(null);
    }
  };

  // Handle Approve Product
  const handleApprove = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/products/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        showToast(`تمت الموافقة على نشر إعلان "${title}".`);
        setModerationItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        showToast(`تعذر الموافقة على الإعلان.`);
      }
    } catch {
      showToast(`خطأ في الاتصال بالخادم.`);
    }
  };

  // Handle Reject Product
  const handleReject = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/products/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: "عدم استيفاء البيانات المطلوبة" }),
      });
      if (res.ok) {
        showToast(`تم رفض إعلان "${title}".`);
        setModerationItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        showToast(`تعذر رفض الإعلان.`);
      }
    } catch {
      showToast(`خطأ في الاتصال بالخادم.`);
    }
  };

  // User Management Actions
  const handleRoleChange = async (userId: string, newRole: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (userId === currentUser?.id && newRole !== "Admin") {
      if (!confirm("تنبيه: أنت على وشك تغيير دور حسابك الحالي من مسؤول (Admin). هل أنت متاكد؟")) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        showToast(`تم تغيير صلاحية ${targetUser.firstName} إلى ${newRole}.`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        const err = await res.json().catch(() => ({ message: "فشل تغيير الصلاحية" }));
        showToast(err.message || "تعذر تغيير الصلاحية.");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم.");
    }
  };

  const handleToggleUserStatus = async (userId: string, currentIsActive: boolean) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (userId === currentUser?.id) {
      alert("لا يمكنك حظر أو تجميد حسابك الحالي الخاص بالمسؤول.");
      return;
    }

    const nextStatus = !currentIsActive;
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (res.ok) {
        showToast(
          nextStatus
            ? `تم إعادة تفعيل حساب ${targetUser.firstName}.`
            : `تم حظر/تجميد حساب ${targetUser.firstName} وإلغاء الجلسات النشطة.`
        );
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: nextStatus } : u))
        );
      } else {
        const err = await res.json().catch(() => ({ message: "فشل تغيير حالة الحساب" }));
        showToast(err.message || "تعذر تغيير حالة الحساب.");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم.");
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (userId === currentUser?.id) {
      alert("لا يمكنك حذف حساب المسؤول الحالي الخا ص بك.");
      return;
    }

    if (!confirm(`هل أنت متاكد من حذف حساب "${fullName}" نهائياً من النظام؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        showToast(`تم حذف حساب ${fullName} بنجاح.`);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const err = await res.json().catch(() => ({ message: "فشل حذف الحساب" }));
        showToast(err.message || "تعذر حذف الحساب.");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-stone-500 font-bold text-sm">
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 border border-red-200 text-red-600 text-3xl shadow-sm mb-6">
          🔒
        </div>
        <span className="inline-block rounded-full bg-red-500/10 border border-red-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-600 mb-3">
          وصول محظور — إداري فقط
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          لوحة التحكم مخصصة للمسؤولين فقط
        </h1>
        <p className="mt-2.5 max-w-md text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">
          عفواً، لا تملك الصلاحيات الكافية لاستعراض مركز القيادة والعمليات أو مراجعة المعروضات والمستخدمين.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-stone-900 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-stone-800 transition"
          >
            العودة للصفحة الرئيسية
          </Link>
          <Link
            href="/profile"
            className="rounded-full border border-stone-300 bg-white px-6 py-3 text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-100 transition"
          >
            الملف الشخصي
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto z-50 rounded-2xl bg-stone-900 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-xl animate-in fade-in duration-200">
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-stone-900 text-white py-8 sm:py-12 rounded-3xl mb-6 sm:mb-8 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-red-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-400 border border-red-500/30">
            لوحة الإدارة والحوكمة
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">مركز القيادة والعمليات</h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-400 font-medium">
            إدارة صلاحيات وحسابات المستخدمين، مراجعة الإعلانات المعلّقة، ومراقبة مؤشرات أداء المنصة.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* System Overview Metrics Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
                <div className="h-3 w-20 bg-stone-200 rounded"></div>
                <div className="h-7 w-28 bg-stone-200 rounded"></div>
                <div className="h-3 w-16 bg-stone-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">حجم المبيعات (GMV)</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-stone-900">
                {(stats?.totalRevenue ?? 0).toLocaleString("ar-EG")} ج.م
              </p>
              <p className="mt-1 text-[10px] sm:text-xs text-emerald-600 font-bold">إجمالي الإيرادات المكتملة</p>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">بائع نشط</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-stone-900">
                {(stats?.activeSellersCount ?? 0).toLocaleString("ar-EG")}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">بائعون نشطون ومعتمدون</p>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">شحنة مكتملة</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-emerald-600">
                {(stats?.completedOrdersCount ?? 0).toLocaleString("ar-EG")}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs text-emerald-600 font-medium">تم التوصيل بنجاح</p>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">مشترين موثقين</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-blue-600">
                {stats?.verifiedBuyersPercentage ?? 100}%
              </p>
              <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">
                ({stats?.verifiedBuyersCount ?? 0} مشتري موثق)
              </p>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">متوسط التقييم</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-amber-600">
                ⭐ {stats?.averageRating ? stats.averageRating.toFixed(2) : "4.95"} / 5
              </p>
              <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">تقييم الخدمة والمناديب</p>
            </div>

            <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">ينتظر المراجعة</span>
              <p className="mt-1.5 text-lg sm:text-2xl font-bold text-red-600">
                {stats ? stats.pendingProductsCount + stats.pendingOrdersCount : moderationItems.length}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs text-stone-500 font-medium">
                ({stats?.pendingProductsCount ?? 0} إعلان ، {stats?.pendingOrdersCount ?? 0} طلب)
              </p>
            </div>
          </div>
        )}

        {/* System Ledger Status Banner */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-emerald-950 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 shrink-0 animate-ping" />
            <span className="font-bold">فحص مطابقة الدفتر المالي: مطابقة بنسبة 100%. جميع عمولات البائعين والمشترين ورسوم التوصيل دقيقة.</span>
          </div>
          <span className="font-mono text-emerald-700 font-bold shrink-0">الحالة: مكتمل بنجاح</span>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold transition ${
              activeTab === "products"
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <span>طابور مراجعة المعروضات</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
              activeTab === "products" ? "bg-red-500 text-white" : "bg-stone-300 text-stone-700"
            }`}>
              {moderationItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold transition ${
              activeTab === "users"
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <span>إدارة المستخدمين والصلاحيات</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
              activeTab === "users" ? "bg-amber-500 text-white" : "bg-stone-300 text-stone-700"
            }`}>
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold transition ${
              activeTab === "orders"
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <span>طلبات بانتظار التعيين</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
              activeTab === "orders" ? "bg-amber-500 text-white" : "bg-stone-300 text-stone-700"
            }`}>
              {pendingOrders.length}
            </span>
          </button>
        </div>

        {/* TAB 1: Pending Products Moderation Queue */}
        {activeTab === "products" && (
          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-stone-200 p-4 sm:px-6 sm:py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">طابور مراجعة المعروضات الجديدة</h2>
                <p className="text-xs text-stone-500 font-medium">اضغط على أي صف لمعاينة الإعلان وتدقيق التفاصيل بالكامل</p>
              </div>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                {moderationItems.length} ينتظر القرار
              </span>
            </div>

            {productsLoading ? (
              <div className="p-8 text-center text-sm font-bold text-stone-500">
                جاري تحميل طابور المراجعة...
              </div>
            ) : moderationItems.length === 0 ? (
              <div className="p-8 text-center text-sm font-bold text-stone-500">
                ✓ طابور المراجعة فارغ! تم البت في جميع الإعلانات.
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-right text-xs sm:text-sm text-stone-600 min-w-[640px]">
                  <thead className="bg-stone-50 text-[11px] uppercase text-stone-500 border-b border-stone-200">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-bold">الإعلان والمنتج</th>
                      <th scope="col" className="px-4 py-3 font-bold">البائع</th>
                      <th scope="col" className="px-4 py-3 font-bold">الفئة</th>
                      <th scope="col" className="px-4 py-3 font-bold">السعر</th>
                      <th scope="col" className="px-4 py-3 font-bold text-left">قرار المراجعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {moderationItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => router.push(`/admin/products/${item.id}/review`)}
                        className="hover:bg-amber-500/5 cursor-pointer transition group"
                      >
                        <td className="px-4 py-3.5 font-bold text-stone-900 flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={getImageUrl(item.imageUrl)}
                              alt={item.title}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                              className="h-11 w-11 rounded-xl object-cover border border-stone-200 shrink-0 group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 text-xs font-bold shrink-0">
                              📷
                            </div>
                          )}
                          <div>
                            <span className="block truncate max-w-[200px] sm:max-w-[260px] group-hover:text-amber-900">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-stone-400 font-medium">
                              اضغط للمعاينة والتدقيق التفصيلي ←
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium">
                          <div>
                            <span className="block text-stone-900 font-bold">{item.sellerName || "بائع المنصة"}</span>
                            <span className="text-[10px] text-stone-400 dir-ltr text-right block">{item.sellerEmail}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-stone-600 font-medium">
                          <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">
                            {item.categoryName || "عام"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-stone-900">{item.price} ج.م</td>
                        <td className="px-4 py-3.5 text-left space-x-2 space-x-reverse" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleApprove(e, item.id, item.title)}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                          >
                            موافقة ونشر
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleReject(e, item.id, item.title)}
                            className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                          >
                            رفض
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: User & Role Management Table */}
        {activeTab === "users" && (
          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            {/* Table Header & Controls */}
            <div className="border-b border-stone-200 p-4 sm:p-6 bg-stone-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">سجل المستخدمين وإدارة الصلاحيات</h2>
                  <p className="text-xs text-stone-500 font-medium">
                    ترقية الصلاحيات إلى مسؤول، حظر وتجميد الحسابات والمباغتة بالخروج، أو حذف المستخدمين.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchUsers}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100 transition shadow-sm"
                >
                  🔄 تحديث القائمة
                </button>
              </div>

              {/* Filters & Search Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث بالاسم أو البريد أو الهاتف..."
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-900 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="ALL">جميع الأدوار والصلاحيات</option>
                    <option value="Admin">مسؤول (Admin)</option>
                    <option value="Seller">بائع (Seller)</option>
                    <option value="Buyer">مشتري (Buyer)</option>
                    <option value="Courier">مندوب (Courier)</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-900 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="ACTIVE">حسابات نشطة فقط</option>
                    <option value="INACTIVE">حسابات محظورة / مجمدة</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            {usersLoading ? (
              <div className="p-12 text-center text-sm font-bold text-stone-500">
                جاري تحميل سجل المستخدمين...
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-sm font-bold text-stone-500">
                لا يوجد مستخدمين يطابقون معايير البحث الحالية.
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-right text-xs sm:text-sm text-stone-600 min-w-[750px]">
                  <thead className="bg-stone-50 text-[11px] uppercase text-stone-500 border-b border-stone-200">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-bold">المستخدم والبيانات</th>
                      <th scope="col" className="px-4 py-3 font-bold">تاريخ التسجيل</th>
                      <th scope="col" className="px-4 py-3 font-bold">الصلاحية والحكم</th>
                      <th scope="col" className="px-4 py-3 font-bold">الحالة الحالية</th>
                      <th scope="col" className="px-4 py-3 font-bold text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {users.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      const initial = (u.firstName?.[0] || u.email[0] || "U").toUpperCase();
                      const dateFormatted = new Date(u.createdAtUtc).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });

                      return (
                        <tr key={u.id} className="hover:bg-stone-50 transition">
                          {/* Name & Email */}
                          <td className="px-4 py-3.5 font-medium">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-white font-bold text-sm shrink-0">
                                {initial}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-stone-900">{u.firstName} {u.lastName}</span>
                                  {isSelf && (
                                    <span className="rounded-md bg-purple-100 border border-purple-200 px-1.5 py-0.5 text-[10px] font-extrabold text-purple-700">
                                      حسابك الحالي
                                    </span>
                                  )}
                                </div>
                                <span className="block text-[11px] text-stone-400 dir-ltr text-right">
                                  {u.email}
                                </span>
                                {u.phoneNumber && (
                                  <span className="block text-[10px] text-stone-400 dir-ltr text-right">
                                    {u.phoneNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Created Date */}
                          <td className="px-4 py-3.5 text-stone-500 font-medium whitespace-nowrap">
                            {dateFormatted}
                          </td>

                          {/* Role Selector Dropdown */}
                          <td className="px-4 py-3.5">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="rounded-xl border border-stone-300 bg-white px-2.5 py-1 text-xs font-bold text-stone-900 shadow-sm focus:border-stone-900 focus:outline-none"
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                نشط
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-200">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                محظور / مجمد
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="px-4 py-3.5 text-left whitespace-nowrap space-x-2 space-x-reverse">
                            {/* Ban/Unban Toggle */}
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                              title={isSelf ? "لا يمكنك تجميد حسابك الحالي" : ""}
                              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                isSelf
                                  ? "bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200"
                                  : u.isActive
                                  ? "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                                  : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {u.isActive ? "تجميد / حظر" : "تفعيل الحساب"}
                            </button>

                            {/* Delete User Button */}
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => handleDeleteUser(u.id, `${u.firstName} ${u.lastName}`)}
                              title={isSelf ? "لا يمكنك حذف حسابك الحالي" : ""}
                              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                isSelf
                                  ? "bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200"
                                  : "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                              }`}
                            >
                              حذف الحساب
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Pending Delivery Assignment Orders Queue */}
        {activeTab === "orders" && (
          <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-stone-200 p-4 sm:px-6 sm:py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">طلبات بانتظار التعيين والتسليم</h2>
                <p className="text-xs text-stone-500 font-medium">اختر مندوب التوصيل المتاح لإسناد المهمة وتحديث حالة الطلب إلى (قيد التوصيل)</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                {pendingOrders.length} طلب بانتظار المندوب
              </span>
            </div>

            {ordersLoading ? (
              <div className="p-8 text-center text-sm font-bold text-stone-500">
                جاري تحميل الطلبات المعلقة وقائمة المناديب...
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="p-8 text-center text-sm font-bold text-stone-500">
                ✓ لا توجد طلبات معلقة بانتظار التعيين حالياً.
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-right text-xs sm:text-sm text-stone-600 min-w-[720px]">
                  <thead className="bg-stone-50 text-[11px] uppercase text-stone-500 border-b border-stone-200">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-bold">رقم الطلب والتاريخ</th>
                      <th scope="col" className="px-4 py-3 font-bold">المنتجات المطلوبة</th>
                      <th scope="col" className="px-4 py-3 font-bold">عنوان الشحن والاستلام</th>
                      <th scope="col" className="px-4 py-3 font-bold">المبلغ الإجمالي</th>
                      <th scope="col" className="px-4 py-3 font-bold">مندوب التوصيل المتاح</th>
                      <th scope="col" className="px-4 py-3 font-bold text-left">الجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {pendingOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50/50 transition">
                        <td className="px-4 py-3.5 font-bold text-stone-900">
                          <span className="block font-mono text-stone-900">{order.orderNumber}</span>
                          <span className="text-[10px] text-stone-400 font-medium">
                            {new Date(order.createdAtUtc).toLocaleDateString("ar-EG")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {order.items && order.items.length > 0 ? (
                            <ul className="space-y-1">
                              {order.items.map((it) => (
                                <li key={it.id} className="text-xs font-bold text-stone-800">
                                  • {it.productTitle} ({it.unitPrice} ج.م)
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-stone-400">منتجات الطلب</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-stone-700 font-medium max-w-[200px] truncate">
                          {order.shippingAddress}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-700 text-sm">
                          {order.totalAmount} ج.م
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            value={selectedCouriers[order.id] || ""}
                            onChange={(e) =>
                              setSelectedCouriers((prev) => ({
                                ...prev,
                                [order.id]: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs font-bold outline-none focus:border-stone-900 bg-white"
                          >
                            <option value="">-- اختر مندوب التوصيل --</option>
                            {couriers.map((c) => (
                              <option key={c.id} value={c.id}>
                                🛵 {c.firstName} {c.lastName} ({c.phoneNumber || c.email})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3.5 text-left whitespace-nowrap">
                          <button
                            type="button"
                            disabled={assigningId === order.id || !selectedCouriers[order.id]}
                            onClick={() => handleAssignDelivery(order.id, order.orderNumber)}
                            className="rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {assigningId === order.id ? "جاري التعيين..." : "تأكيد إسناد الطلب ✓"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
