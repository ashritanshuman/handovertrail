import React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { ShareCheckResponse, ShareCheckFinding } from "../../types";

interface ShareCheckPanelProps {
  shareCheck: ShareCheckResponse | null;
  loading?: boolean;
}

export const ShareCheckPanel: React.FC<ShareCheckPanelProps> = ({
  shareCheck,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white border border-[#d8d0c0] rounded-xl p-5 shadow-xs animate-pulse space-y-3">
        <div className="h-5 bg-[#EBE8E0] rounded w-1/3" />
        <div className="h-16 bg-[#F4F3EE] rounded" />
      </div>
    );
  }

  if (!shareCheck) {
    return null;
  }

  const { can_publish, block_count, warn_count, info_count, findings } = shareCheck;

  return (
    <div className="bg-white border border-[#d8d0c0] rounded-2xl p-5 shadow-xs space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EBE8E0]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#2B2521] text-white flex items-center justify-center">
            <Lock size={13} />
          </div>
          <h3 className="text-sm font-semibold text-[#241d18]">Share Check Audit</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
            can_publish
              ? "bg-[#EEF6EF] text-[#38523A] border-[#B5D8B8]"
              : "bg-[#FEF2F2] text-[#BA1A1A] border-[#FCA5A5]"
          }`}
        >
          {can_publish ? (
            <>
              <CheckCircle2 size={12} />
              <span>Publish Ready</span>
            </>
          ) : (
            <>
              <ShieldAlert size={12} />
              <span>Blocked ({block_count})</span>
            </>
          )}
        </span>
      </div>

      {/* Summary Pills */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div
          className={`p-2 rounded-lg border ${
            block_count > 0 ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#BA1A1A]" : "bg-[#F9F8F5] border-[#EBE8E0] text-[#5C544F]"
          }`}
        >
          <div className="font-bold text-sm">{block_count}</div>
          <div className="text-[10px] uppercase font-semibold">Blockers</div>
        </div>
        <div
          className={`p-2 rounded-lg border ${
            warn_count > 0 ? "bg-[#FEF7ED] border-[#FCD34D] text-[#8F5105]" : "bg-[#F9F8F5] border-[#EBE8E0] text-[#5C544F]"
          }`}
        >
          <div className="font-bold text-sm">{warn_count}</div>
          <div className="text-[10px] uppercase font-semibold">Warnings</div>
        </div>
        <div className="p-2 rounded-lg border bg-[#F0F4F8] border-[#C8D6E5] text-[#2B3E50]">
          <div className="font-bold text-sm">{info_count}</div>
          <div className="text-[10px] uppercase font-semibold">Info Items</div>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {findings.length === 0 ? (
          <div className="text-center py-4 text-xs text-[#6B635E]">
            All automated confidentiality and safety checks passed cleanly.
          </div>
        ) : (
          findings.map((f: ShareCheckFinding, idx: number) => {
            const isBlock = f.severity === "block";
            const isWarn = f.severity === "warn";
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  isBlock
                    ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#BA1A1A]"
                    : isWarn
                    ? "bg-[#FEF7ED] border-[#FCD34D] text-[#8F5105]"
                    : "bg-[#F0F4F8] border-[#C8D6E5] text-[#2B3E50]"
                }`}
              >
                <div className="flex items-center justify-between gap-1 font-semibold">
                  <span className="inline-flex items-center gap-1">
                    {isBlock && <ShieldAlert size={13} />}
                    {isWarn && <AlertTriangle size={13} />}
                    {!isBlock && !isWarn && <Info size={13} />}
                    <span>{f.category}</span>
                  </span>
                  <span className="font-mono text-[10px] bg-white/70 px-1.5 py-0.5 rounded border border-current/20">
                    {f.location}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#413934]">{f.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
