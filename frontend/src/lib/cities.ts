export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface Governorate {
  id: string;
  nameAr: string;
  cities: string[];
}

export const EGYPTIAN_GOVERNORATES: Governorate[] = [
  { id: "gharbia", nameAr: "الغربية", cities: ["المحلة الكبرى", "طنطا"] },
  { id: "monufia", nameAr: "المنوفية", cities: ["شبين الكوم"] },
  { id: "dakahlia", nameAr: "الدقهلية", cities: ["المنصورة"] },
];

export function getCitiesForGovernorate(governorateNameAr: string): string[] {
  const gov = EGYPTIAN_GOVERNORATES.find((g) => g.nameAr === governorateNameAr);
  return gov ? gov.cities : [];
}

export const ALLOWED_CITIES: City[] = [
  { id: "mahalla", nameAr: "المحلة الكبرى", nameEn: "El Mahalla El Kubra" },
  { id: "tanta", nameAr: "طنطا", nameEn: "Tanta" },
  { id: "shebin", nameAr: "شبين الكوم", nameEn: "Shebin El Kom" },
  { id: "mansoura", nameAr: "المنصورة", nameEn: "Mansoura" },
];

export const ALLOWED_CITY_NAMES: string[] = EGYPTIAN_GOVERNORATES.flatMap((g) => g.cities);

/**
 * Checks if a given city or address string matches one of the allowed Egyptian cities.
 */
export function isValidCity(cityNameOrAddress: string): boolean {
  if (!cityNameOrAddress) return false;
  const normalized = cityNameOrAddress.trim();
  return ALLOWED_CITIES.some((city) => {
    const target = city.nameAr;
    if (normalized.includes(target)) return true;
    if (target === "المحلة الكبرى" && (normalized.includes("المحله الكبري") || normalized.includes("المحلة الكبري") || normalized.includes("المحله الكبرى") || normalized.includes("المحلة"))) return true;
    if (target === "المنصورة" && (normalized.includes("المنصوره") || normalized.includes("منصورة") || normalized.includes("منصوره"))) return true;
    if (target === "شبين الكوم" && (normalized.includes("شبين") || normalized.includes("شبين الكوم"))) return true;
    if (target === "طنطا" && normalized.includes("طنطا")) return true;
    return false;
  });
}
