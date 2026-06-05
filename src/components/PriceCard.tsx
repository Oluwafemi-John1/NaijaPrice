import React from "react";
import { MapPin, Check, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PriceReport } from "../types";

interface PriceCardProps {
  report: PriceReport & { voted?: "up" | "down" };
  onVote: (id: string, type: "up" | "down") => void;
}

function TrendIndicator({ trend, pct }: { trend: "up" | "down" | "stable"; pct?: number }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
        <TrendingUp className="w-4 h-4" />
        {pct ? `${pct}%` : "Up"}
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
        <TrendingDown className="w-4 h-4" />
        {pct ? `${pct}%` : "Down"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
      <Minus className="w-4 h-4" />
      Stable
    </span>
  );
}

export default function PriceCard({ report, onVote }: PriceCardProps) {
  return (
    <div className="bg-white border border-slate-100 hover:border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 relative group">

      {report.verified && (
        <span className="absolute top-5 right-6 bg-secondary-container text-on-secondary-container text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-amber-300">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          Verified
        </span>
      )}

      <div>
        <div className="flex items-center gap-3.5 mb-5 select-none">
          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-2xl group-hover:bg-primary/10 transition-colors">
            {report.icon}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800 leading-snug group-hover:text-primary transition-colors">
              {report.productName}
            </h3>
            <p className="text-xs text-slate-400 font-medium">{report.unit}</p>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            ₦{report.price.toLocaleString()}
          </span>
          <TrendIndicator trend={report.trend} pct={report.changePercent} />
        </div>

        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-4 pl-0.5">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="underline decoration-slate-200 font-semibold text-slate-700">{report.marketName}</span>
          <span className="text-slate-300">|</span>
          <span>{report.state}</span>
        </p>

        {report.comments && (
          <div className="bg-slate-50 rounded-2xl p-3.5 text-xs text-slate-600 border border-slate-100/50 italic mb-5 leading-relaxed relative pl-5">
            <span className="absolute left-2.5 top-3.5 text-emerald-800 font-bold">"</span>
            {report.comments}
          </div>
        )}
      </div>

      <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium flex flex-col">
          <span>Observed on {report.dateObserved}</span>
          <span className="text-slate-500 font-bold">By {report.contributor}</span>
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onVote(report.id, "up")}
            className={`p-2 rounded-xl transition-all active:scale-90 flex items-center gap-1 ${
              report.voted === "up"
                ? "bg-primary text-white font-bold"
                : "bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-emerald-700"
            }`}
            title="Confirm Price Is Accurate"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="text-[10px]">{report.upvotes}</span>
          </button>

          <button
            onClick={() => onVote(report.id, "down")}
            className={`p-2 rounded-xl transition-all active:scale-90 flex items-center gap-1 ${
              report.voted === "down"
                ? "bg-red-600 text-white font-bold"
                : "bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-700"
            }`}
            title="Flag Discrepancy"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span className="text-[10px]">{report.downvotes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
