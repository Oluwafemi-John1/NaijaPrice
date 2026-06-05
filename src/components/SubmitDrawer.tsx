import React, { FormEvent } from "react";
import { Plus, X, MapPin, Calendar, CheckCircle2 } from "lucide-react";

const NIGERIA_STATES = [
  "Lagos", "Abuja", "Oyo", "Kano", "Kaduna", "Rivers", "Anambra", "Enugu", "Edo",
  "Delta", "Ogun", "Ondo", "Kwara", "Sokoto", "Plateau", "Abia",
];

interface SubmitDrawerProps {
  submitSuccess: boolean;
  drawerProductName: string;
  drawerCategory: "food" | "fuel" | "construction" | "other";
  drawerPrice: string;
  drawerUnit: string;
  drawerMarket: string;
  drawerState: string;
  drawerDate: string;
  drawerContributor: string;
  isAnonymous: boolean;
  drawerComments: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  setDrawerProductName: (v: string) => void;
  setDrawerCategory: (v: "food" | "fuel" | "construction" | "other") => void;
  setDrawerPrice: (v: string) => void;
  setDrawerUnit: (v: string) => void;
  setDrawerMarket: (v: string) => void;
  setDrawerState: (v: string) => void;
  setDrawerDate: (v: string) => void;
  setDrawerContributor: (v: string) => void;
  setIsAnonymous: (v: boolean) => void;
  setDrawerComments: (v: string) => void;
}

export default function SubmitDrawer({
  submitSuccess,
  drawerProductName,
  drawerCategory,
  drawerPrice,
  drawerUnit,
  drawerMarket,
  drawerState,
  drawerDate,
  drawerContributor,
  isAnonymous,
  drawerComments,
  onClose,
  onSubmit,
  setDrawerProductName,
  setDrawerCategory,
  setDrawerPrice,
  setDrawerUnit,
  setDrawerMarket,
  setDrawerState,
  setDrawerDate,
  setDrawerContributor,
  setIsAnonymous,
  setDrawerComments,
}: SubmitDrawerProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center animate-fade-in"
      onClick={onClose}
      id="submissionDrawer"
    >
      <div
        className="bg-white rounded-t-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col translate-y-0 transition-transform duration-350"
        onClick={(e) => e.stopPropagation()}
        id="drawerContent"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70 select-none">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Submit New Live Price</h3>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider leading-none mt-0.5">Crowdsourced verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors border border-slate-200"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="overflow-y-auto p-6 space-y-6 flex-grow">
          {submitSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto scale-110">
                <CheckCircle2 className="w-10 h-10 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Price Registered</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                This price has been dynamically logged on the NaijaPrice. Live contributors will verify accuracy shortly!
              </p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* Product Name + Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Product Name</label>
                  <input
                    type="text"
                    required
                    value={drawerProductName}
                    onChange={(e) => setDrawerProductName(e.target.value)}
                    placeholder="e.g. Garri (White), Yam tuber"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                    list="preset-products"
                  />
                  <datalist id="preset-products">
                    <option value="Crate of Eggs" />
                    <option value="Petrol (PMS)" />
                    <option value="Garri (White)" />
                    <option value="Dangote Cement" />
                    <option value="Yam (Medium Tuber)" />
                    <option value="Tomatoes (Large Basket)" />
                    <option value="Local Rice (50kg)" />
                    <option value="Onions (Small Bag)" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Category</label>
                  <select
                    value={drawerCategory}
                    onChange={(e) => setDrawerCategory(e.target.value as "food" | "fuel" | "construction" | "other")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="food">🍱 Food Staples</option>
                    <option value="fuel">⛽ Fuel &amp; Power</option>
                    <option value="construction">🧱 Building Materials</option>
                    <option value="other">⚙️ Other Essentials</option>
                  </select>
                </div>
              </div>

              {/* Price + Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Price in Naira (₦)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1c1b1b] font-bold text-base">₦</span>
                    <input
                      type="number"
                      required
                      value={drawerPrice}
                      onChange={(e) => setDrawerPrice(e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Unit Observed</label>
                  <select
                    value={drawerUnit}
                    onChange={(e) => setDrawerUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="Crate">Crate</option>
                    <option value="Per Litre">Per Litre</option>
                    <option value="50kg Bag">50kg Bag</option>
                    <option value="Mudu">Mudu</option>
                    <option value="Medium Tuber">Medium Tuber</option>
                    <option value="Large Basket">Large Basket</option>
                    <option value="Small Basket">Small Basket</option>
                    <option value="Per kg">Per kg</option>
                  </select>
                </div>
              </div>

              {/* Market + State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Market / Location Name</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={drawerMarket}
                      onChange={(e) => setDrawerMarket(e.target.value)}
                      placeholder="e.g. Mile 12 Market, Singer Kano"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">State Location</label>
                  <select
                    value={drawerState}
                    onChange={(e) => setDrawerState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    {NIGERIA_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date + Contributor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Date Observed</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={drawerDate}
                      onChange={(e) => setDrawerDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Contributor Name</label>
                  <div className="flex flex-col gap-1.5 bg-slate-50 p-2 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="anon-checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <label htmlFor="anon-checkbox" className="text-xs font-bold text-slate-600 select-none">Remain Anonymous</label>
                    </div>
                    {!isAnonymous && (
                      <input
                        type="text"
                        required
                        value={drawerContributor}
                        onChange={(e) => setDrawerContributor(e.target.value)}
                        placeholder="Your Name / business handle"
                        className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-slate-400"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Extra Bargaining Comments (Optional)</label>
                <textarea
                  value={drawerComments}
                  onChange={(e) => setDrawerComments(e.target.value)}
                  placeholder="e.g. Quality was fine, can bargain for retail discount, plenty available"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                />
              </div>

            </div>
          )}
        </form>

        {/* Footer */}
        {!submitSuccess && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 select-none">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-600 text-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="bg-primary hover:bg-primary-container text-white font-extrabold rounded-xl px-7 py-3 text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Post to NaijaPrice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
