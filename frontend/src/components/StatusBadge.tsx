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
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#5F7A61]/12 text-[#38523A] border border-[#5F7A61]/35 font-medium ${className}`}
      >
        <Check size={iconSize} strokeWidth={2} className="text-[#38523A]" />
        <span>Verified</span>
      </span>
    );
  }

  if (normStatus === "inferred") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#6B7F94]/12 text-[#3C5066] border border-[#6B7F94]/35 font-medium ${className}`}
      >
        <Info size={iconSize} strokeWidth={1.75} className="text-[#3C5066]" />
        <span>Inferred</span>
      </span>
    );
  }

  if (normStatus === "conflicting") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#C9822B]/12 text-[#8F5105] border border-[#C9822B]/35 font-medium ${className}`}
      >
        <AlertTriangle size={iconSize} strokeWidth={1.75} className="text-[#8F5105]" />
        <span>Conflicting</span>
      </span>
    );
  }

  // Missing or default
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#6B635E]/12 text-[#6B635E] border border-[#d8d0c0] font-medium ${className}`}
    >
      <HelpCircle size={iconSize} strokeWidth={1.75} className="text-[#6B635E]" />
      <span>Missing evidence</span>
    </span>
  );
};

