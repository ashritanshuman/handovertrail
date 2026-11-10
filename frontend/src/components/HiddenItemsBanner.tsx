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
      className={`rounded-xl border border-[#d8d0c0] bg-white p-4 shadow-[0_1px_2px_rgba(70,63,58,0.04)] transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-body-default font-body-default text-[#241d18]">
          <Lock size={16} className="text-[#6B635E] shrink-0" />
          <span>
            <strong className="font-semibold">{hiddenCount} items</strong> are hidden based on your{" "}
            <span className="font-mono text-xs bg-[#F4F3EE] text-[#241d18] border border-[#d8d0c0] px-1.5 py-0.5 rounded">
              Clearance Level {currentUser.clearance} ({currentUser.role})
            </span>{" "}
            access.
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-label-caption font-label-caption text-[#5C544F] hover:text-[#241d18] transition-colors underline decoration-[#d8d0c0] underline-offset-4 inline-flex items-center gap-1 self-start sm:self-auto font-medium"
        >
          <span>Learn about redaction policy</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 pt-3.5 border-t border-[#d8d0c0] text-sm text-[#241d18] space-y-2 animate-fade-in">
          <p className="leading-relaxed">
            <strong>Permission-Aware Redaction Rule:</strong> HandoverTrail ensures that leavers and
            successors never view content above their explicit clearance level.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-2 rounded bg-[#F4F3EE] border border-[#d8d0c0]">
              <strong className="block text-[#241d18]">Level 1: Team</strong>
              <span className="text-[#5C544F]">General architecture, public repos, non-confidential tasks.</span>
            </div>
            <div className="p-2 rounded bg-[#F4F3EE] border border-[#d8d0c0]">
              <strong className="block text-[#241d18]">Level 2: Lead Only</strong>
              <span className="text-[#5C544F]">Personnel decisions, executive budgets, unannounced roadmap.</span>
            </div>
            <div className="p-2 rounded bg-[#F4F3EE] border border-[#d8d0c0]">
              <strong className="block text-[#241d18]">Level 3: Confidential</strong>
              <span className="text-[#5C544F]">Production root secrets, private keys, executive HR.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
