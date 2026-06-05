import React from "react";
import { SlidersHorizontal, AlertTriangle, Info } from "lucide-react";
import { PriceReport } from "../types";

interface CompareViewProps {
  processedReports: (PriceReport & { voted?: "up" | "down" })[];
  compareProduct: string;
  onProductChange: (product: string) => void;
  onOpenDrawer: (product?: string) => void;
}

export default function CompareView({ processedReports, compareProduct, onProductChange, onOpenDrawer }: CompareViewProps) {
  const distinctProducts = Array.from(new Set(processedReports.map((r) => r.productName)));
  const matchingReports = processedReports.filter((r) => r.productName === compareProduct).sort((a, b) => a.price - b.price);

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3.5 py-1 rounded-full text-xs font-bold mb-3 tracking-wide">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Compare side-by-side pricing
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Market Price Contrast Engine</h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto">
            Compare current commodities across major states in Nigeria. Find where it's cheapest &amp; avoid market price hikes.
          </p>
        </div>

        {/* Selection Panel */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto">
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2 pl-1 tracking-wider">Select Commodity to Compare</label>
            <select
              value={compareProduct}
              onChange={(e) => onProductChange(e.target.value)}
              className="w-full md:w-80 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none focus:outline-none"
            >
              {distinctProducts.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-auto flex flex-col md:items-end justify-center">
            <span className="text-[11px] text-slate-400 font-medium">Standard unit reference</span>
            <span className="text-lg font-bold text-[#1c1b1b]">
              {processedReports.find((r) => r.productName === compareProduct)?.unit || "Standard Unit"}
            </span>
          </div>
        </div>

        {/* Comparison list */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest pl-1">Nigeria Market Reports for "{compareProduct}"</h3>

          {matchingReports.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-500">
              <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No logged reports for this commodity across states yet! Click Below to log one.
              <button
                onClick={() => onOpenDrawer(compareProduct)}
                className="block mx-auto mt-4 text-xs font-bold text-primary underline"
              >
                Report pricing for "{compareProduct}"
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500">
                      <th className="px-6 py-4">Market / Location</th>
                      <th className="px-6 py-4">State</th>
                      <th className="px-6 py-4">Status Tag</th>
                      <th className="px-6 py-4 text-right">Reported Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {matchingReports.map((rep, idx) => (
                      <tr key={rep.id} className="hover:bg-slate-50/40 transition-colors text-sm font-medium text-slate-700">
                        <td className="px-6 py-4 flex items-center gap-2">
                          <span className="text-xs">{idx === 0 ? "🥇" : "📍"}</span>
                          <div>
                            <span className="font-bold text-slate-800">{rep.marketName}</span>
                            {idx === 0 && (
                              <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black uppercase">Cheapest</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{rep.state}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-bold ${
                            rep.verified ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-600"
                          }`}>
                            {rep.verified ? "Verified Log" : "User Report"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-slate-900 text-base">
                          ₦{rep.price.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Advisory Banner */}
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 flex items-start gap-3 mt-10">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-extrabold text-amber-900">Volatility Advice Note</p>
            <p className="leading-relaxed">
              Agricultural yields and fuel transportation logistics can significantly shift the retail cost score across states by up to 25% weekly. Always confirm the date observed before relying on crowd values.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
