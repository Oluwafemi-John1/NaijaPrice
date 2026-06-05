export interface PriceReport {
  id: string;
  productName: string;
  category: "food" | "fuel" | "construction" | "other";
  unit: string;
  price: number;
  prevPrice?: number;
  changePercent?: number; // percentage
  trend: "up" | "down" | "stable";
  marketName: string;
  state: string;
  verified: boolean;
  contributor: string;
  dateObserved: string;
  comments?: string;
  icon: string; // Emoji or Lucide icon name
  upvotes: number;
  downvotes: number;
  voted?: "up" | "down";
  ownerId?: string;
  voters?: Record<string, "up" | "down">;
}

export type SupportedLanguage = "en" | "pidgin" | "yo" | "ig" | "ha";

export interface LanguageCopy {
  heroTitle: string;
  heroSub: string;
  searchPlaceholder: string;
  popularLabel: string;
  reportsTitle: string;
  reportsSub: string;
  viewAll: string;
  emptyTitle: string;
  emptySub: string;
  beFirstBtn: string;
  browseBtn: string;
  boughtTitle: string;
  boughtSub: string;
  submitBtn: string;
}
