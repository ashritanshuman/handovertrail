import React from "react";
import { ClaimType } from "../types";

const TYPE_LABELS: Record<ClaimType | string, string> = {
  decision: "Decision",
  task: "Task",
  risk: "Risk",
  dependency: "Dependency",
  open_question: "Open question",
  contact: "Contact",
};

interface TypeChipProps {
  type: ClaimType | string;
  className?: string;
}

export const TypeChip: React.FC<TypeChipProps> = ({ type, className = "" }) => {
  const label = TYPE_LABELS[type.toLowerCase()] || type;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F4F3EE] border border-[#E7E4DE] text-[#463F3A] text-label-caption font-label-caption ${className}`}
    >
      {label}
    </span>
  );
};

