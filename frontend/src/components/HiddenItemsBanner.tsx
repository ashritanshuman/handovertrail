import React, { useState } from "react";
import { Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useHandover } from "../context/HandoverContext";

interface HiddenItemsBannerProps {
  hiddenCount?: number;
  className?: string;
}

export const HiddenItemsBanner: React.FC<HiddenItemsBannerProps> = ({
  hiddenCount = 4,
  className = "",
}) => {
  const { currentUser } = useHandover();
  const [expanded, setExpanded] = useState(false);

  // If user has clearance level 3 (confidential), no items are hidden
  if (currentUser.clearance >= 3) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border border-[#E7E4DE] bg-white p-4 shadow-[0_1px_2px_rgba(70,63,58,0.04)] transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-body-default font-body-default text-[#463F3A]">
          <Lock size={16} className="text-[#8A817C] shrink-0" />
          <span>
            <strong className="font-semibold">{hiddenCount} items</strong> are hidden based on your{" "}
            <span className="font-mono text-[12px] bg-[#F4F3EE] px-1.5 py-0.5 rounded">
              Clearance Level {currentUser.clearance} ({currentUser.role})
            </span>{" "}
            access.
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-label-caption font-label-caption text-[#8A817C] hover:text-[#463F3A] transition-colors underline decoration-[#BCB8B1] underline-offset-4 inline-flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Learn about redaction policy</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 pt-3.5 border-t border-[#E7E4DE] text-[13px] text-[#463F3A] space-y-2 animate-fade-in">
          <p className="leading-relaxed">
            <strong>Permission-Aware Redaction Rule:</strong> HandoverTrail ensures that leavers and
            successors never view content above their explicit clearance level.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[12px]">
            <div className="p-2 rounded bg-[#F4F3EE] border border-[#E7E4DE]">
              <strong className="block text-[#463F3A]">Level 1: Team</strong>
              <span className="text-[#8A817C]">General architecture, public repos, non-confidential tasks.</span>
            </div>
            <div className="p-2 rounded bg-[#F4F3EE] border border-[#E7E4DE]">
              <strong className="block text-[#463F3A]">Level 2: Lead Only</strong>
              <span className="text-[#8A817C]">Personnel decisions, executive budgets, unannounced roadmap.</span>
            </div>
            <div className="p-2 rounded bg-[#F4F3EE] border border-[#E7E4DE]">
              <strong className="block text-[#463F3A]">Level 3: Confidential</strong>
              <span className="text-[#8A817C]">Production root secrets, private keys, executive HR.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
