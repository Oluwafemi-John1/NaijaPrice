import React from "react";
import { Search, Plus, X, ArrowRight } from "lucide-react";
import { PriceReport, LanguageCopy } from "../types";
import PriceCard from "./PriceCard";

interface HomeFeedProps {
  filteredReports: (PriceReport & { voted?: "up" | "down" })[];
  searchQuery: string;
  selectedCategory: string;
  copy: LanguageCopy;
  onSearchChange: (q: string) => void;
  onCategoryChange: (cat: string) => void;
  onVote: (id: string, type: "up" | "down") => void;
  onOpenDrawer: (product?: string) => void;
  onNotify: (msg: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "All Items", icon: "🍱" },
  { id: "food", label: "Food Staples", icon: "🌾" },
  { id: "fuel", label: "Fuel & Power", icon: "⛽" },
  { id: "construction", label: "Building Materials", icon: "🧱" },
  { id: "other", label: "Other Essentials", icon: "⚙️" },
];

const QUICK_TAGS = ["Rice", "Tomatoes", "Fuel (PMS)", "Cement", "Eggs", "Garri"];
const TAG_LABELS: Record<string, string> = {
  Rice: "🌾 Rice",
  Tomatoes: "🍅 Tomatoes",
  "Fuel (PMS)": "⛽ Fuel",
  Cement: "🧱 Cement",
  Eggs: "🥚 Eggs",
  Garri: "🥣 Garri",
};

export default function HomeFeed({
  filteredReports,
  searchQuery,
  selectedCategory,
  copy,
  onSearchChange,
  onCategoryChange,
  onVote,
  onOpenDrawer,
  onNotify,
}: HomeFeedProps) {
  return (
    <div>
      {/* HERO MODULE */}
      <section className="relative overflow-hidden pt-8 pb-12 rounded-[2rem] bg-gradient-to-tr from-emerald-950 to-emerald-900 text-white px-6 md:px-12 mb-10 shadow-lg select-none">
        <div className="absolute inset-0 hero-pattern pointer-events-none opacity-10"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-secondary-container px-3.5 py-1 rounded-full text-xs font-bold mb-4 tracking-wide border border-white/5 animate-pulse">
            <span>🇳🇬 Trusted by 50,000+ local sellers &amp; buyers</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Find the <span className="text-secondary-container underline decoration-wavy decoration-3">real price</span>. <br className="hidden sm:inline" /> From real Nigerians.
          </h1>

          <p className="text-sm md:text-md text-emerald-100/90 mb-8 max-w-2xl leading-relaxed">
            Join crowd-sourced market intelligence. Real-time cost database of yams, tomatoes, fuel, mudus of Rice, and bags of Cement direct from traders today.
          </p>

          {/* Search bar */}
          <div className="w-full max-w-2xl relative mb-4">
            <div className="flex items-center bg-white rounded-2xl shadow-xl overflow-hidden p-1.5 border border-white hover:ring-4 hover:ring-primary/20 transition-all group">
              <Search className="w-5 h-5 ml-3 text-slate-400 group-hover:text-primary transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="w-full border-none focus:ring-0 text-[#1c1b1b] text-sm md:text-md px-3 py-3 font-medium placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => onSearchChange("")} className="p-1 text-slate-400 hover:text-slate-600 mr-2 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onNotify(`Now showing details for "${searchQuery || "all item feed"}"`)}
                className="bg-primary hover:bg-primary-container text-white font-bold rounded-xl px-6 py-3 text-sm active:scale-95 transition-all outline-none"
              >
                Check Price
              </button>
            </div>
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-emerald-200 font-semibold">{copy.popularLabel}</span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => { onSearchChange(tag); onCategoryChange("all"); onNotify(`Filtered reports to "${tag}"`); }}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-3.5 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {TAG_LABELS[tag]}
              </button>
            ))}
            {searchQuery && (
              <button
                onClick={() => { onSearchChange(""); onCategoryChange("all"); }}
                className="text-secondary-container font-bold underline cursor-pointer pl-2 hover:text-[#ffe16d]"
              >
                Show All
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
            {copy.reportsTitle}
          </h2>
          <p className="text-xs md:text-sm text-slate-500">{copy.reportsSub}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { onCategoryChange(cat.id); onNotify(`Viewing ${cat.label}`); }}
              className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                selectedCategory === cat.id
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-zinc-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Empty state or grid */}
      {filteredReports.length === 0 ? (
        <div
          className="w-full flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-3xl border border-zinc-100 shadow-xs relative overflow-hidden"
          id="search-empty-state"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative w-64 h-64 md:w-72 md:h-72 mb-6">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ1I-vE9hrXoJNWFYjvVoaRxrNY4RXqxAvSct8_7zTO-EWcu9Db0GK0_0T5JIh5mTCOuvbauIsWc3GI_kbAuLBFXlvA3tDSj0CzpSgpTLjsha0CWSfXMZ5UeMnrc2nwabLMC51vfpB_pmoKdb7uDAPpI1WcWDqq_0xgiL12yh__4hLFCyPaWLxxGyCanc8ftb20JbXHTGYLs2fMIXkNtIUVDUgNVEhmn3xSBnIxTlLuzdjBKcFcAXxhwtEOfeczKM_iOX76uyHhPs"
              alt="No results empty crate"
              className="relative z-10 w-full h-full object-contain mx-auto rounded-2xl"
            />
            <div className="absolute bottom-6 right-8 bg-secondary-container text-on-secondary-container hover:scale-105 duration-255 font-black text-xl p-3 shadow-md rounded-2xl rotate-12 border border-amber-400">
              ₦?
            </div>
          </div>

          <h3 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b] mb-2 tracking-tight">
            {copy.emptyTitle.replace("{query}", searchQuery || selectedCategory)}
          </h3>
          <p className="font-body-lg text-slate-500 max-w-lg mb-8 leading-relaxed text-sm md:text-md">
            {copy.emptySub}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onOpenDrawer(searchQuery || undefined)}
              className="w-full sm:w-auto bg-primary hover:bg-primary-container text-white font-bold rounded-xl px-6 py-3.5 text-sm shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              {copy.beFirstBtn}
            </button>
            <button
              onClick={() => { onSearchChange(""); onCategoryChange("all"); onNotify("Cleared all search filters."); }}
              className="w-full sm:w-auto border border-zinc-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl px-6 py-3.5 text-sm transition-all"
            >
              {copy.browseBtn}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="price-reports-grid">
          {filteredReports.map((report) => (
            <PriceCard key={report.id} report={report} onVote={onVote} />
          ))}
        </div>
      )}

      {/* CTA Section */}
      <section className="bg-primary rounded-[2.5rem] mt-16 p-8 md:p-12 text-white relative overflow-hidden shadow-lg select-none">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald-700 opacity-20 transform skew-x-12 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight">{copy.boughtTitle}</h2>
            <p className="text-sm md:text-md text-emerald-100 leading-relaxed max-w-2xl font-light">{copy.boughtSub}</p>
          </div>
          <button
            onClick={() => onOpenDrawer()}
            className="bg-secondary-container hover:bg-[#ffe16d] text-on-secondary-container font-black px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 text-sm md:text-md flex items-center gap-2 tracking-wide cursor-pointer"
          >
            {copy.submitBtn}
            <ArrowRight className="w-5 h-5 shrink-0" />
          </button>
        </div>
      </section>
    </div>
  );
}
