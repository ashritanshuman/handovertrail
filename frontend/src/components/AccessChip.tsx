import React from "react";
import { Lock, ShieldCheck } from "lucide-react";

interface AccessChipProps {
  level: number;
  className?: string;
}

export const AccessChip: React.FC<AccessChipProps> = ({ level, className = "" }) => {
  let label = "Access: Team";
  let isElevated = false;

  if (level === 2) {
    label = "Access: Lead";
    isElevated = true;
  } else if (level === 3) {
    label = "Access: Confidential";
    isElevated = true;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F4F3EE] border border-[#d8d0c0] text-[#241d18] text-label-caption font-label-caption font-medium ${className}`}
    >
      {isElevated ? (
        <Lock size={12} className="text-[#6B635E]" strokeWidth={1.75} />
      ) : (
        <ShieldCheck size={12} className="text-[#38523A]" strokeWidth={1.75} />
      )}
      <span>{label}</span>
    </span>
  );
};

