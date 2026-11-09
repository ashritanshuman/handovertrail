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
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F4F3EE] border border-[#E7E4DE] text-[#463F3A] text-label-caption font-label-caption ${className}`}
    >
      {isElevated ? (
        <Lock size={12} className="text-[#8A817C]" strokeWidth={1.75} />
      ) : (
        <ShieldCheck size={12} className="text-[#5F7A61]" strokeWidth={1.75} />
      )}
      <span>{label}</span>
    </span>
  );
};

