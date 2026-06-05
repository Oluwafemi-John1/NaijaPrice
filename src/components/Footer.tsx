import React from "react";
import { SupportedLanguage } from "../types";

interface FooterProps {
  onTabChange: (tab: "home") => void;
  onSearchChange: (q: string) => void;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export default function Footer({ onTabChange, onSearchChange, onLanguageChange }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-white mt-16 border-t border-slate-800 py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">

        <div className="max-w-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
              ✓
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
              NaijaPrice
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-light">
            Empowering Nigerians with transparent live market metrics. Ground truth consumer costs generated exclusively by the people, for the people.
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-xs">👋 Community Managed</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs">🟢 100% Verified Nodes</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 md:gap-16">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Marketplaces Hub</p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><button onClick={() => { onTabChange("home"); onSearchChange("Rice"); }} className="hover:text-primary hover:underline transition-all font-medium text-left">Rice Staples Feed</button></li>
              <li><button onClick={() => { onTabChange("home"); onSearchChange("Tomatoes"); }} className="hover:text-primary hover:underline transition-all font-medium text-left">Basket Tomatoes</button></li>
              <li><button onClick={() => { onTabChange("home"); onSearchChange("Fuel"); }} className="hover:text-primary hover:underline transition-all font-medium text-left">PMS fuel (Abuja/Lagos)</button></li>
              <li><button onClick={() => { onTabChange("home"); onSearchChange("Cement"); }} className="hover:text-primary hover:underline transition-all font-medium text-left">Cement Bag Cost</button></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Information Node</p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#" className="hover:text-primary hover:underline transition-all font-medium">About Platform</a></li>
              <li><a href="#" className="hover:text-primary hover:underline transition-all font-medium">Verified Contributor Program</a></li>
              <li><a href="#" className="hover:text-primary hover:underline transition-all font-medium">Report Discrepancy</a></li>
              <li><a href="#" className="hover:text-primary hover:underline transition-all font-medium">Developer Price Feed API</a></li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 max-w-xs space-y-2">
          <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-primary rounded-full"></span>
            Nigerian Realities Disclaimer
          </h4>
          <p className="text-[11px] text-slate-400 italic leading-relaxed">
            "Prices are community-reported. Always verify before major transactions. NaijaPrice does not transact, sell, or inventory any listed items directly."
          </p>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
        <p>© 2026 NaijaPrice Tracker community collaboration, Lagos, Abuja. Created for the proud people of Nigeria.</p>
        <div className="flex gap-4 font-semibold">
          <span className="hover:text-white transition-colors cursor-pointer" onClick={() => onLanguageChange("en")}>English</span>
          <span className="hover:text-white transition-colors cursor-pointer" onClick={() => onLanguageChange("pidgin")}>Pidgin</span>
          <span className="hover:text-white transition-colors cursor-pointer" onClick={() => onLanguageChange("yo")}>Yorùbá</span>
          <span className="hover:text-white transition-colors cursor-pointer" onClick={() => onLanguageChange("ig")}>Igbo</span>
          <span className="hover:text-white transition-colors cursor-pointer" onClick={() => onLanguageChange("ha")}>Hausa</span>
        </div>
      </div>
    </footer>
  );
}
