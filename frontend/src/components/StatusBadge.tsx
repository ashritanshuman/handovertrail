import React from "react";
import { Check, HelpCircle, AlertTriangle, Info } from "lucide-react";
import { ClaimStatus } from "../types";

interface StatusBadgeProps {
  status: ClaimStatus | string;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  className = "",
}) => {
  const normStatus = (status || "").toLowerCase();

  const iconSize = size === "sm" ? 13 : 14;

  if (normStatus === "verified") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#5F7A61]/12 text-[#5F7A61] border border-[#5F7A61]/30 font-medium ${className}`}
      >
        <Check size={iconSize} strokeWidth={2} />
        <span>Verified</span>
      </span>
    );
  }

  if (normStatus === "inferred") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#6B7F94]/12 text-[#6B7F94] border border-[#6B7F94]/30 font-medium ${className}`}
      >
        <Info size={iconSize} strokeWidth={1.75} />
        <span>Inferred</span>
      </span>
    );
  }

  if (normStatus === "conflicting") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#C9822B]/12 text-[#C9822B] border border-[#C9822B]/30 font-medium ${className}`}
      >
        <AlertTriangle size={iconSize} strokeWidth={1.75} />
        <span>Conflicting</span>
      </span>
    );
  }

  // Missing or default
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#8A817C]/12 text-[#8A817C] border border-[#8A817C]/30 font-medium ${className}`}
    >
      <HelpCircle size={iconSize} strokeWidth={1.75} />
      <span>Missing evidence</span>
    </span>
  );
};

