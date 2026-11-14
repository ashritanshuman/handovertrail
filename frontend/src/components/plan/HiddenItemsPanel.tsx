import React from "react";
import { EyeOff, Shield, Lock } from "lucide-react";
import { HiddenItemDetail } from "../../types";

interface HiddenItemsPanelProps {
  hiddenItems: HiddenItemDetail[];
  confidentialCount: number;
}

export const HiddenItemsPanel: React.FC<HiddenItemsPanelProps> = ({
  hiddenItems,
  confidentialCount,
}) => {
  const totalHidden = hiddenItems.length + confidentialCount;

  return (
    <div className="bg-white border border-[#d8d0c0] rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EBE8E0]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#5C544F] text-white flex items-center justify-center">
            <EyeOff size={13} />
          </div>
          <h3 className="text-sm font-semibold text-[#241d18]">Hidden from Successor</h3>
        </div>
        <span className="text-xs font-mono font-medium text-[#6B635E] bg-[#F4F3EE] px-2 py-0.5 rounded border border-[#d8d0c0]">
          {totalHidden} Restricted
        </span>
      </div>

      <p className="text-xs text-[#5C544F] leading-relaxed">
        The successor (Arjun Rao, Clearance 1) will see an aggregated badge but cannot view the items below.
      </p>

      {/* Level 2 items list */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {hiddenItems.length === 0 ? (
          <div className="text-center py-3 text-xs text-[#8A817C] italic">
            No Level 2 Lead-only items exist in this handover snapshot.
          </div>
        ) : (
          hiddenItems.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl border border-[#d8d0c0] bg-[#FDFCF7] text-xs space-y-1"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] text-[#6B635E] bg-white px-1.5 py-0.5 rounded border border-[#d8d0c0]">
                  {item.id} · {item.type}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8F5105] bg-[#FEF7ED] px-2 py-0.5 rounded-full border border-[#FCD34D]">
                  <Shield size={10} />
                  <span>{item.reason}</span>
                </span>
              </div>
              <p className="font-medium text-[#241d18] line-clamp-2 leading-snug">
                {item.title}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Level 3 Confidential Items Summary (Count ONLY, strictly zero content!) */}
      {confidentialCount > 0 && (
        <div className="p-3 rounded-xl border border-[#d8d0c0] bg-[#F4F3EE] flex items-center gap-2.5 text-xs text-[#5C544F]">
          <div className="w-5 h-5 rounded-full bg-[#2B2521] text-white flex items-center justify-center shrink-0">
            <Lock size={11} />
          </div>
          <div>
            <span className="font-semibold text-[#241d18]">
              {confidentialCount} confidential items hidden
            </span>
            <span className="text-[11px] text-[#6B635E] block">
              Level 3 credentials and sensitive HR discussions are completely omitted from all views.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
