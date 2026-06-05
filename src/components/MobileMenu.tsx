import React from "react";
import { Plus, User, ChevronRight } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

interface MobileMenuProps {
  user: FirebaseUser | null;
  activeTab: "home" | "submit" | "compare" | "admin";
  onTabChange: (tab: "home" | "submit" | "compare" | "admin") => void;
  onOpenDrawer: () => void;
  onClose: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export default function MobileMenu({
  user,
  activeTab,
  onTabChange,
  onOpenDrawer,
  onClose,
  onLogin,
  onLogout,
}: MobileMenuProps) {
  return (
    <div className="fixed inset-0 top-20 z-30 bg-black/40 backdrop-blur-xs md:hidden animate-fade-in">
      <div className="bg-white px-5 py-6 space-y-4 border-b border-slate-100 shadow-xl flex flex-col justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Navigation</p>
          <button
            onClick={() => { onTabChange("home"); onClose(); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${
              activeTab === "home" ? "bg-slate-100 text-primary font-bold" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>Live Feed</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { onClose(); onOpenDrawer(); }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 transition-all text-left"
          >
            <span>Report Price</span>
            <ChevronRight className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={() => { onTabChange("compare"); onClose(); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${
              activeTab === "compare" ? "bg-slate-100 text-primary font-bold" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>Compare Markets</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { onTabChange("admin"); onClose(); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${
              activeTab === "admin" ? "bg-slate-100 text-primary font-bold" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2">
              Admin Portal
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          {user ? (
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user.displayName?.charAt(0) || "U"
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-800">{user.displayName || "Google User"}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">Logged In</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-xs text-red-500 hover:text-red-700 font-extrabold"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <User className="w-4 h-4 text-slate-400" />
              Sign In with Google
            </button>
          )}

          <button
            onClick={() => { onClose(); onOpenDrawer(); }}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 focus:ring-2 focus:ring-primary/20 hover:bg-primary-container"
          >
            <Plus className="w-5 h-5" />
            Report New Price Now
          </button>
        </div>
      </div>
    </div>
  );
}
