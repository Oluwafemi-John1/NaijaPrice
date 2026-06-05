import React from "react";
import { Plus, User, Globe, Menu, X } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { SupportedLanguage } from "../types";

interface NavbarProps {
  user: FirebaseUser | null;
  activeTab: "home" | "submit" | "compare" | "admin";
  selectedLanguage: SupportedLanguage;
  isMobileMenuOpen: boolean;
  onLogoClick: () => void;
  onTabChange: (tab: "home" | "submit" | "compare" | "admin") => void;
  onOpenDrawer: () => void;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onLogin: () => void;
  onLogout: () => void;
  onToggleMobileMenu: () => void;
}

export default function Navbar({
  user,
  activeTab,
  selectedLanguage,
  isMobileMenuOpen,
  onLogoClick,
  onTabChange,
  onOpenDrawer,
  onLanguageChange,
  onLogin,
  onLogout,
  onToggleMobileMenu,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-20 px-4 md:px-8">

        {/* Logo */}
        <div
          onClick={onLogoClick}
          className="flex items-center gap-2 overflow-hidden cursor-pointer transition-transform duration-200 active:scale-95"
          id="app-logo"
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black shadow-md border border-emerald-700">
            ✓
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl tracking-tight text-primary flex items-center gap-1">
              NaijaPrice
              <span className="text-xs px-1.5 py-0.5 bg-secondary-container text-on-secondary-container rounded font-bold uppercase tracking-widest leading-none">Live</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider -mt-1">Crowdsourced Tracker</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-3" id="desktop-nav">
          <button
            onClick={() => onTabChange("home")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "home"
                ? "bg-slate-100 text-primary font-bold"
                : "text-zinc-600 hover:bg-slate-50 hover:text-primary"
            }`}
          >
            Home Feed
          </button>
          <button
            onClick={onOpenDrawer}
            className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-slate-50 hover:text-primary transition-all"
          >
            Submit Report
          </button>
          <button
            onClick={() => onTabChange("compare")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "compare"
                ? "bg-slate-100 text-primary font-bold"
                : "text-zinc-600 hover:bg-slate-50 hover:text-primary"
            }`}
          >
            Compare Markets
          </button>
          <button
            onClick={() => onTabChange("admin")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "admin"
                ? "bg-slate-100 text-primary font-bold"
                : "text-zinc-600 hover:bg-slate-50 hover:text-primary"
            }`}
          >
            Admin Moderation
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </button>
        </nav>

        {/* Controls: Language and Quick CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0">
              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-[10px] font-bold uppercase overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                ) : (
                  user.displayName?.charAt(0) || "U"
                )}
              </div>
              <span className="text-[11px] font-bold text-zinc-700 max-w-[90px] truncate">{user.displayName || "Google User"}</span>
              <button
                onClick={onLogout}
                className="text-[10px] text-red-500 hover:text-red-700 font-extrabold ml-1 border-l border-slate-200 pl-1.5"
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-[#191919] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs active:scale-95 text-center shrink-0 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
              Sign In with Google
            </button>
          )}

          {/* Language Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 gap-1.5">
            <Globe className="w-4 h-4 text-slate-500" />
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-transparent border-none text-xs font-semibold text-zinc-700 focus:ring-0 focus:outline-none cursor-pointer py-0 pl-0 pr-6"
            >
              <option value="en">English (EN)</option>
              <option value="pidgin">Pidgin (WA)</option>
              <option value="yo">Yorùbá (YỌ)</option>
              <option value="ig">Igbo (IG)</option>
              <option value="ha">Hausa (HA)</option>
            </select>
          </div>

          <button
            onClick={onOpenDrawer}
            className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow-md hover:bg-primary-container hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Report Price
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-1">
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            className="bg-slate-50 border-none text-xs font-bold text-zinc-700 py-1.5 px-2 rounded-xl focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="en">🇬🇧 EN</option>
            <option value="pidgin">🇳🇬 WA</option>
            <option value="yo">🇳🇬 YỌ</option>
            <option value="ig">🇳🇬 IG</option>
            <option value="ha">🇳🇬 HA</option>
          </select>

          <button
            onClick={onToggleMobileMenu}
            className="p-2 ml-1 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
            id="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>
    </header>
  );
}
