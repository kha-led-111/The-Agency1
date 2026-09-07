export type Subcategory = {
  name: string;
  slug: string;
};

export type Category = {
  name: string;
  slug: string;
  description: string;
  items: number;
  accent: string;
  imageUrl: string;
  subcategories: Subcategory[];
};

export type Product = {
  id: number;
  slug: string;
  title: string;
  price: number;
  condition: string;
  seller: string;
  location: string;
  category: string;
  subcategory?: string;
  rating: number;
  reviews: number;
  accent: string;
  imageUrl: string;
  badge: string;
  description: string;
  features: string[];
};

export type Order = {
  id: string;
  orderNumber: string;
  productTitle: string;
  productSlug: string;
  productPrice: number;
  deliveryFee: number;
  buyerFee: number;
  sellerCommission: number;
  totalAmount: number;
  status: "PendingPayment" | "Paid" | "Processing" | "OutForDelivery" | "Delivered" | "Cancelled";
  paymentMethod: string;
  shippingAddress: string;
  createdAt: string;
  courierName?: string;
  courierPhone?: string;
};

export type TrackingLog = {
  id: string;
  status: string;
  note: string;
  timestamp: string;
};

export type LedgerSummary = {
  availableBalance: number;
  pendingCashHeld: number;
  totalEarned: number;
  totalFeesPaid: number;
};

export const categories: Category[] = [
  {
    name: "ملابس نسائية",
    slug: "womens-clothing",
    description: "معاطف أنيقة، ملابس منزلية، فساتين ومجموعات يومية راقية",
    items: 182,
    accent: "from-rose-200 via-orange-100 to-yellow-100",
    imageUrl: "/images/categories/womens-clothing.png",
    subcategories: [
      { name: "منزلي", slug: "homewear" },
      { name: "فساتين", slug: "dresses" },
      { name: "معاطف وجاكيتات", slug: "coats" },
      { name: "عبايات وأزياء تراثية", slug: "abayas" },
      { name: "حقائب وإكسسوارات نسائية", slug: "bags" },
    ],
  },
  {
    name: "ملابس رجالية",
    slug: "mens-clothing",
    description: "قطع كلاسيكية وبدل رسمية وأزياء عصرية",
    items: 147,
    accent: "from-sky-200 via-cyan-100 to-emerald-100",
    imageUrl: "/images/categories/mens-clothing.png",
    subcategories: [
      { name: "بدل ورسميات", slug: "suits" },
      { name: "قمصان وتيشيرتات", slug: "shirts" },
      { name: "جاكيتات ومعاطف", slug: "jackets" },
    ],
  },
  {
    name: "إكسسوارات وساعات",
    slug: "accessories-watches",
    description: "حقائب يد فاخرة، ساعات ومقتنيات مميزة",
    items: 96,
    accent: "from-violet-200 via-purple-100 to-pink-100",
    imageUrl: "/images/categories/accessories-watches.png",
    subcategories: [
      { name: "ساعات فاخرة", slug: "watches" },
      { name: "حقائب كتف", slug: "shoulder-bags" },
      { name: "نظارات ومجوهرات", slug: "jewelry" },
    ],
  },
  {
    name: "أحذية رياضية",
    slug: "sneakers",
    description: "أحذية حصرية وإصدارات رياضية متميزة",
    items: 58,
    accent: "from-emerald-200 via-teal-100 to-sky-100",
    imageUrl: "/images/categories/sneakers.png",
    subcategories: [
      { name: "أحذية جري", slug: "running" },
      { name: "أحذية كاجوال", slug: "casual" },
      { name: "إصدارات خاصة", slug: "special-edition" },
    ],
  },
  {
    name: "أطفال",
    slug: "kids",
    description: "ملابس أنيقة، ألعاب تعليمية، مستلزمات رعاية وأحذية للأطفال وحديثي الولادة",
    items: 75,
    accent: "from-amber-200 via-rose-100 to-sky-100",
    imageUrl: "/images/categories/kids.png",
    subcategories: [
      { name: "ملابس أطفال", slug: "kids-clothing" },
      { name: "ألعاب ومستلزمات", slug: "toys-gear" },
      { name: "أحذية أطفال", slug: "kids-shoes" },
      { name: "حديثي الولادة", slug: "baby-care" },
    ],
  },
];

export const products: Product[] = [
  {
    id: 1,
    slug: "atelier-trench-coat",
    title: "معطف اتيليه كلاسيكي (Atelier Trench)",
    price: 148,
    condition: "ممتاز",
    seller: "ميرا ر.",
    location: "القاهرة - المعادي",
    category: "ملابس نسائية",
    subcategory: "معاطف وجاكيتات",
    rating: 4.9,
    reviews: 28,
    accent: "from-stone-200 via-rose-100 to-orange-100",
    imageUrl: "/images/products/atelier-trench-coat.png",
    badge: "وصل حديثاً",
    description: "معطف فاخر مصمم من القطن الناعم الممشوط مع أكتاف محددة وقصة محايدة أنيقة. مثالي للإطلالات اليومية واللقاءات الرسمية.",
    features: ["تنظيف جاف فقط", "بطانة داخلية كاملة", "أزرار كبس مخفية"],
  },
  {
    id: 2,
    slug: "heritage-leather-jacket",
    title: "جاكيت جلدي كلاسيكي (Heritage Leather)",
    price: 220,
    condition: "جيد جداً",
    seller: "رامي ك.",
    location: "الجيزة - الزمالك",
    category: "ملابس رجالية",
    subcategory: "جاكيتات ومعاطف",
    rating: 4.8,
    reviews: 17,
    accent: "from-neutral-200 via-slate-100 to-zinc-100",
    imageUrl: "/images/products/heritage-leather-jacket.png",
    badge: "الأكثر طلباً",
    description: "جاكيت جلد راقي بتصميم عصري مريح مع مرونة خفيفة عند الأكمام لتوفير أقصى درجات الراحة وحرية الحركة.",
    features: ["جلد طبيعي 100%", "جيوب أفقية واسعة", "بطانة ناعمة مريحة"],
  },
  {
    id: 3,
    slug: "monarch-shoulder-bag",
    title: "حقيبة كتف مونارك (Monarch Leather Bag)",
    price: 96,
    condition: "ممتاز",
    seller: "إيلينا ج.",
    location: "الإسكندرية - سموحة",
    category: "إكسسوارات وساعات",
    subcategory: "حقائب كتف",
    rating: 4.7,
    reviews: 42,
    accent: "from-violet-200 via-fuchsia-100 to-pink-100",
    imageUrl: "/images/products/monarch-shoulder-bag.png",
    badge: "قطعة مميزة",
    description: "حقيبة كتف هيكلية باللون الرملي الدافئ مع إكسسوارات معدنية ذهبية ومساحة تتسع لجميع المستلزمات اليومية.",
    features: ["قفل مغناطيسي قوي", "جيب داخلي بسحاب", "تفاصيل معدنية مطلية"],
  },
  {
    id: 4,
    slug: "silk-loungewear-set",
    title: "طقم منزلي حريري فاخر (Silk Homewear)",
    price: 340,
    condition: "ممتاز",
    seller: "لينا ب.",
    location: "القاهرة - التجمع الخامس",
    category: "ملابس نسائية",
    subcategory: "منزلي",
    rating: 4.9,
    reviews: 19,
    accent: "from-amber-200 via-orange-100 to-yellow-50",
    imageUrl: "/images/categories/womens-clothing.png",
    badge: "منزلي مريح",
    description: "طقم بيجامة ومنزلي أنيق مصنوع من الحرير الناعم والتصميم المريح ليوفر لكِ أقصى درجات الاسترخاء والأناقة داخل المنزل.",
    features: ["حرير طبيعي 100%", "قصة مريحة ومرنة", "سهل الغسيل والعناية"],
  },
  {
    id: 5,
    slug: "neo-runner-sneaker",
    title: "حذاء رياضي نيو رانر (Neo Runner)",
    price: 120,
    condition: "كالجديد",
    seller: "عمر ت.",
    location: "القاهرة - الشيخ زايد",
    category: "أحذية رياضية",
    subcategory: "أحذية جري",
    rating: 5.0,
    reviews: 51,
    accent: "from-emerald-200 via-teal-100 to-cyan-100",
    imageUrl: "/images/products/neo-runner-sneaker.png",
    badge: "الأكثر مبيعاً",
    description: "حذاء رياضي خفيف الوزن ومريح جداً للمشي اليومي، مصمم بنسيج محبوك يسمح بالتهوية مع نعل رغوي ممتص للصدمات.",
    features: ["نسيج محبوك للمسامية", "نعل رغوي مبطن", "رباط مطاطي متناسق"],
  },
  {
    id: 6,
    slug: "silk-evening-dress",
    title: "فستان سهرة حريري راقي (Silk Evening Dress)",
    price: 260,
    condition: "ممتاز",
    seller: "سارة أ.",
    location: "القاهرة - مصر الجديدة",
    category: "ملابس نسائية",
    subcategory: "فساتين",
    rating: 4.8,
    reviews: 14,
    accent: "from-stone-300 via-neutral-100 to-amber-100",
    imageUrl: "/images/products/atelier-trench-coat.png",
    badge: "مختارات حصرية",
    description: "فستان نسائي أنيق بتصميم عصري راقي ولون جذاب وملمس حريري ناعم مناسب للمناسبات الخاصة واللقاءات الفاخرة.",
    features: ["تصميم عصري مميز", "سحاب خلفي مخفي", "قصة متناسقة وجذابة"],
  },
  {
    id: 7,
    slug: "kids-cotton-set",
    title: "طقم قطني مريح للأطفال (Cotton Kids Set)",
    price: 85,
    condition: "جديد بالتكت",
    seller: "هبة م.",
    location: "القاهرة - 6 أكتوبر",
    category: "أطفال",
    subcategory: "ملابس أطفال",
    rating: 4.9,
    reviews: 22,
    accent: "from-amber-200 via-yellow-100 to-rose-100",
    imageUrl: "/images/categories/kids.png",
    badge: "قطن طبيعي 100%",
    description: "طقم صيفي للأطفال مصنوع من القطن المصري العضوي الفاخر، ناعم جداً على البشرة ومناسب للعب والحركة اليومية.",
    features: ["قطن 100% ناعم", "ألوان ثابته وآمنة", "سهل الارتداء والغسيل"],
  },
  {
    id: 8,
    slug: "kids-soft-sneakers",
    title: "حذاء رياضي خفيف للأطفال (Kids Soft Sneakers)",
    price: 65,
    condition: "ممتاز",
    seller: "أحمد س.",
    location: "الجيزة - الدقي",
    category: "أطفال",
    subcategory: "أحذية أطفال",
    rating: 4.8,
    reviews: 19,
    accent: "from-sky-200 via-cyan-100 to-emerald-100",
    imageUrl: "/images/products/neo-runner-sneaker.png",
    badge: "نعل مرن ومريح",
    description: "حذاء رياضي للأطفال بتصميم جذاب وقفل لاصق (فيلكرو) لتسهيل الارتداء الذاتي مع نعل مطاطي مانع للانزلاق.",
    features: ["شريط فيلكرو سريع", "نعل مانع للانزلاق", "خفيف ومريح جداً"],
  },
  {
    id: 9,
    slug: "educational-toy-set",
    title: "مجموعة مكعبات تعليمية للأطفال (Educational Wooden Set)",
    price: 110,
    condition: "كالجديد",
    seller: "مريم ك.",
    location: "الإسكندرية - الجمرك",
    category: "أطفال",
    subcategory: "ألعاب ومستلزمات",
    rating: 5.0,
    reviews: 31,
    accent: "from-purple-200 via-pink-100 to-yellow-100",
    imageUrl: "/images/categories/accessories-watches.png",
    badge: "تنمية مهارات",
    description: "مجموعة مكعبات خشبية آمنة ومطورة خصيصاً لتنمية الذكاء والمهارات الحركية والإبداعية لدى الأطفال من سن 2 إلى 6 سنوات.",
    features: ["خشب طبيعي غير سام", "حواف دائرية آمنة", "تنمي التفكير الإبداعي"],
  },
  {
    id: 10,
    slug: "baby-care-nest",
    title: "طقم فراش ومستلزمات حديثي الولادة (Baby Nest Care)",
    price: 145,
    condition: "ممتاز",
    seller: "رضوى ن.",
    location: "القاهرة - الشروق",
    category: "أطفال",
    subcategory: "حديثي الولادة",
    rating: 4.9,
    reviews: 15,
    accent: "from-rose-200 via-pink-100 to-orange-100",
    imageUrl: "/images/categories/womens-clothing.png",
    badge: "راحة للرضيع",
    description: "عش مريح ومحمول لحديثي الولادة يمنح الرضيع شعوراً بالأمان والراحة التامة أثناء النوم والحرص على استقامة الظهر.",
    features: ["وسادة مريحة للرأس", "أقمشة مسامية تنفس", "قابل للغسيل بالكامل"],
  },
];

export const mockOrders: Order[] = [
  {
    id: "ord-8812",
    orderNumber: "AG-881204",
    productTitle: "معطف اتيليه كلاسيكي (Atelier Trench)",
    productSlug: "atelier-trench-coat",
    productPrice: 148,
    deliveryFee: 30,
    buyerFee: 14.8,
    sellerCommission: 14.8,
    totalAmount: 192.8,
    status: "OutForDelivery",
    paymentMethod: "الدفع عند الاستلام (COD)",
    shippingAddress: "فيلا 14، المعادي، القاهرة",
    createdAt: "04 سبتمبر 2026 - 10:30 صباحاً",
    courierName: "طارق المنصور",
    courierPhone: "+20 100 123 4567",
  },
  {
    id: "ord-7731",
    orderNumber: "AG-773192",
    productTitle: "حذاء رياضي نيو رانر (Neo Runner)",
    productSlug: "neo-runner-sneaker",
    productPrice: 120,
    deliveryFee: 30,
    buyerFee: 12,
    sellerCommission: 12,
    totalAmount: 162,
    status: "Delivered",
    paymentMethod: "الدفع عند الاستلام (COD)",
    shippingAddress: "شقة 802، التجمع الخامس، القاهرة",
    createdAt: "03 سبتمبر 2026 - 02:15 مساءً",
    courierName: "حسان علي",
    courierPhone: "+20 111 987 6543",
  },
  {
    id: "ord-6410",
    orderNumber: "AG-641029",
    productTitle: "حقيبة كتف مونارك (Monarch Leather Bag)",
    productSlug: "monarch-shoulder-bag",
    productPrice: 96,
    deliveryFee: 30,
    buyerFee: 9.6,
    sellerCommission: 9.6,
    totalAmount: 135.6,
    status: "Processing",
    paymentMethod: "الدفع عند الاستلام (COD)",
    shippingAddress: "برج ب، الشيخ زايد، الجيزة",
    createdAt: "04 سبتمبر 2026 - 08:45 صباحاً",
  },
];

export const mockTrackingLogs: TrackingLog[] = [
  { id: "t1", status: "تم تأكيد الطلب", note: "تم حجز المنتجات وتأكيد طلب التوصيل.", timestamp: "10:30 صباحاً" },
  { id: "t2", status: "تم تعيين مندوب التوصيل", note: "تم إسناد الشحنة إلى المندوب طارق المنصور (دراجة نارية).", timestamp: "10:45 صباحاً" },
  { id: "t3", status: "تم استلام الشحنة من البائع", note: "قام المندوب باستلام الشحنة من ميرا ر.", timestamp: "11:20 صباحاً" },
  { id: "t4", status: "الشحنة قيد التوصيل", note: "المندوب في طريقه إلى عنوان العميل.", timestamp: "12:05 مساءً" },
];

export const mockLedger: LedgerSummary = {
  availableBalance: 1240.5,
  pendingCashHeld: 192.8,
  totalEarned: 3420.0,
  totalFeesPaid: 342.0,
};

export const featureBenefits = [
  {
    title: "بائعون موثوقون",
    description: "فحص دقيق للهوية وتقييمات شفافة تضمن أعلى مستويات الثقة في كل صفقة.",
  },
  {
    title: "حماية كاملة للمشتري",
    description: "نظام الدفع عند الاستلام بعد الفحص المباشر يحميك ويضمن مطابقة القطعة للمواصفات.",
  },
  {
    title: "توصيل سريع وموثوق",
    description: "تتبع لحظي للطلب بمبلغ ثابت 30 ج.م مع مناديب توصيل موثوقين وتنسيق مباشر لكل شحنة.",
  },
];

export const homeStats = [
  { label: "بائع نشط", value: "+2,400" },
  { label: "شحنة مكتملة", value: "18,000" },
  { label: "مشترين موثقين", value: "96%" },
  { label: "متوسط التقييم", value: "4.9/5" },
];
