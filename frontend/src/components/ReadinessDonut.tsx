import React from "react";
import { CheckCircle2, HelpCircle, AlertTriangle, Info } from "lucide-react";
import { StatsResponse } from "../types";

interface ReadinessDonutProps {
  stats: StatsResponse | null;
  className?: string;
}

export const ReadinessDonut: React.FC<ReadinessDonutProps> = ({ stats, className = "" }) => {
  const verified = stats?.by_status?.verified ?? 30;
  const inferred = stats?.by_status?.inferred ?? 8;
  const conflicting = stats?.by_status?.conflicting ?? 4;
  const missing = stats?.by_status?.missing ?? 6;
  const total = stats?.total_claims || (verified + inferred + conflicting + missing) || 48;

  const C = 2 * Math.PI * 40; // 251.327

  const vPct = total > 0 ? (verified / total) * 100 : 0;
  const iPct = total > 0 ? (inferred / total) * 100 : 0;
  const cPct = total > 0 ? (conflicting / total) * 100 : 0;
  const mPct = total > 0 ? (missing / total) * 100 : 0;

  const vDash = (vPct / 100) * C;
  const iDash = (iPct / 100) * C;
  const cDash = (cPct / 100) * C;
  const mDash = (mPct / 100) * C;

  const vOffset = 0;
  const iOffset = -vDash;
  const cOffset = -(vDash + iDash);
  const mOffset = -(vDash + iDash + cDash);

  return (
    <article
      className={`bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col justify-between ${className}`}
    >
      <div>
        <h2 className="text-headline-section font-headline-section text-[#241d18] font-semibold">
          Handover readiness
        </h2>
        <p className="text-body-default font-body-default text-[#5C544F] mt-0.5">
          Verification status distribution
        </p>

        {/* Thin SVG Donut Chart */}
        <div className="relative flex justify-center items-center py-6">
          <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle cx="50" cy="50" fill="transparent" r="40" stroke="#F4F3EE" strokeWidth="6" />

            {/* Verified (Sage) */}
            {verified > 0 && (
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#38523A"
                strokeDasharray={`${vDash} ${C}`}
                strokeDashoffset={vOffset}
                strokeWidth="6"
              />
            )}

            {/* Inferred (Slate Blue) */}
            {inferred > 0 && (
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#3C5066"
                strokeDasharray={`${iDash} ${C}`}
                strokeDashoffset={iOffset}
                strokeWidth="6"
              />
            )}

            {/* Conflicting (Warm Ochre) */}
            {conflicting > 0 && (
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#8F5105"
                strokeDasharray={`${cDash} ${C}`}
                strokeDashoffset={cOffset}
                strokeWidth="6"
              />
            )}

            {/* Missing Evidence (Grey-Olive) */}
            {missing > 0 && (
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#6B635E"
                strokeDasharray={`${mDash} ${C}`}
                strokeDashoffset={mOffset}
                strokeWidth="6"
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-display-stat font-display-stat text-[#241d18] leading-tight font-medium">
              {total}
            </span>
            <span className="text-label-caption font-label-caption text-[#6B635E] font-medium">Total claims</span>
          </div>
        </div>
      </div>

      {/* Four Progress Breakdown Rows */}
      <div className="space-y-3 pt-2 border-t border-[#d8d0c0]">
        {/* Verified */}
        <div className="flex items-center justify-between text-body-default font-body-default">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#38523A]" />
            <span className="text-[#241d18] font-medium">Verified</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#6B635E] text-label-mono-metadata font-label-mono-metadata font-medium">
              {verified} claims
            </span>
            <span className="px-2 py-0.5 rounded-full text-label-caption font-label-caption bg-[#5F7A61]/12 text-[#38523A] border border-[#5F7A61]/35 font-semibold">
              {Math.round(vPct)}%
            </span>
          </div>
        </div>

        {/* Inferred */}
        <div className="flex items-center justify-between text-body-default font-body-default">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-[#3C5066]" />
            <span className="text-[#241d18] font-medium">Inferred</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#6B635E] text-label-mono-metadata font-label-mono-metadata font-medium">
              {inferred} claims
            </span>
            <span className="px-2 py-0.5 rounded-full text-label-caption font-label-caption bg-[#6B7F94]/12 text-[#3C5066] border border-[#6B7F94]/35 font-semibold">
              {Math.round(iPct)}%
            </span>
          </div>
        </div>

        {/* Conflicting */}
        <div className="flex items-center justify-between text-body-default font-body-default">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#8F5105]" />
            <span className="text-[#241d18] font-medium">Conflicting</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#6B635E] text-label-mono-metadata font-label-mono-metadata font-medium">
              {conflicting} claims
            </span>
            <span className="px-2 py-0.5 rounded-full text-label-caption font-label-caption bg-[#C9822B]/12 text-[#8F5105] border border-[#C9822B]/35 font-semibold">
              {Math.round(cPct)}%
            </span>
          </div>
        </div>

        {/* Missing Evidence */}
        <div className="flex items-center justify-between text-body-default font-body-default">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-[#6B635E]" />
            <span className="text-[#241d18] font-medium">Missing evidence</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#6B635E] text-label-mono-metadata font-label-mono-metadata font-medium">
              {missing} claims
            </span>
            <span className="px-2 py-0.5 rounded-full text-label-caption font-label-caption bg-[#6B635E]/12 text-[#6B635E] border border-[#d8d0c0] font-semibold">
              {Math.round(mPct)}%
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

