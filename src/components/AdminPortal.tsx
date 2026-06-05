import React from "react";
import { RefreshCw, CheckCircle2, Trash2 } from "lucide-react";
import { PriceReport } from "../types";

interface AdminPortalProps {
  processedReports: (PriceReport & { voted?: "up" | "down" })[];
  onToggleVerification: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onResetSystem: () => void;
}

export default function AdminPortal({ processedReports, onToggleVerification, onDeleteReport, onResetSystem }: AdminPortalProps) {
  return (
    <div>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              NaijaPrice Moderation Dashboard
              <span className="text-xs px-2 py-0.5 bg-amber-500 text-white rounded-full font-black uppercase">Live Logs</span>
            </h2>
            <p className="text-slate-500 text-xs">Simulated admin panel - Approve fresh reports, toggle verified badges, or remove fraud.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onResetSystem}
              className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all text-center shrink-0"
              title="Restore Initial System Reports"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset System Reports
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Active Community Logs</p>
            <p className="text-2xl font-black text-slate-800">{processedReports.length}</p>
            <span className="text-[10px] text-emerald-600 font-bold">Live database sync active</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Verified Badges</p>
            <p className="text-2xl font-black text-amber-600">{processedReports.filter((r) => r.verified).length}</p>
            <span className="text-[10px] text-amber-600 font-semibold">Toggled from moderation lists</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Reported Inflation Index</p>
            <p className="text-2xl font-black text-red-600">32.1%</p>
            <span className="text-[10px] text-red-500 font-semibold">Calculated from consumer posts</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Reputation Score</p>
            <p className="text-2xl font-black text-[#006b3f]">9.8 / 10</p>
            <span className="text-[10px] text-emerald-600 font-semibold">High confidence crowd pool</span>
          </div>
        </div>

        {/* Moderation Queue */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest">Moderation Queue &amp; Active Entries</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {processedReports.map((report) => (
              <div key={report.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                <div className="flex items-start gap-3.5">
                  <span className="text-2xl p-2 bg-slate-50 rounded-xl select-none">{report.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{report.productName}</span>
                      <span className="text-xs text-slate-400">({report.unit})</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        report.verified ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-600"
                      }`}>
                        {report.verified ? "Verified" : "Pending Community Checks"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium my-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-slate-700">{report.marketName}</span>
                      <span>({report.state})</span>
                      <span className="text-slate-300">|</span>
                      <span>Reported by {report.contributor}</span>
                      <span className="text-slate-300">|</span>
                      <span>{report.dateObserved}</span>
                    </p>
                    {report.comments && (
                      <p className="text-xs text-slate-400 italic pl-1 mt-1 border-l-2 border-slate-200">"{report.comments}"</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <div className="text-right mr-3 hidden sm:block">
                    <p className="text-xs text-slate-400 font-semibold">Cost Value</p>
                    <p className="text-base font-black text-slate-900">₦{report.price.toLocaleString()}</p>
                  </div>

                  <button
                    onClick={() => onToggleVerification(report.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
                      report.verified
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50/30"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {report.verified ? "Verified" : "Verify Log"}
                  </button>

                  <button
                    onClick={() => onDeleteReport(report.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                    title="Delete Erroneous Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
