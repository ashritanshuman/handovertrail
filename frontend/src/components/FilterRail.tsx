import React from "react";
import { Filter } from "lucide-react";

interface FilterRailProps {
  selectedType: string;
  onSelectType: (type: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  typeCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  totalCount: number;
  className?: string;
}

export const FilterRail: React.FC<FilterRailProps> = ({
  selectedType,
  onSelectType,
  selectedStatus,
  onSelectStatus,
  typeCounts,
  statusCounts,
  totalCount,
  className = "",
}) => {
  const typeOptions: Array<{ key: string; label: string }> = [
    { key: "all", label: "All" },
    { key: "decision", label: "Decisions" },
    { key: "task", label: "Tasks" },
    { key: "risk", label: "Risks" },
    { key: "dependency", label: "Dependencies" },
    { key: "open_question", label: "Open questions" },
    { key: "contact", label: "Contacts" },
  ];

  const statusOptions: Array<{ key: string; label: string; dotColor: string }> = [
    { key: "all", label: "All", dotColor: "bg-[#6B635E]" },
    { key: "verified", label: "Verified", dotColor: "bg-[#38523A]" },
    { key: "inferred", label: "Inferred", dotColor: "bg-[#3C5066]" },
    { key: "conflicting", label: "Conflicting", dotColor: "bg-[#8F5105]" },
    { key: "missing", label: "Missing evidence", dotColor: "bg-[#6B635E]" },
  ];

  return (
    <aside
      className={`bg-white border border-[#d8d0c0] rounded-xl p-5 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col gap-6 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#d8d0c0]">
        <h2 className="text-headline-section font-headline-section text-[#241d18] font-semibold">Filters</h2>
        <Filter size={16} className="text-[#6B635E]" />
      </div>

      {/* Filter Group 1: Type */}
      <div className="flex flex-col gap-1.5">
        <div className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] uppercase tracking-wider mb-1 font-semibold">
          Type
        </div>
        {typeOptions.map((opt) => {
          const isSelected = selectedType === opt.key;
          const count = opt.key === "all" ? totalCount : typeCounts[opt.key] || 0;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSelectType(opt.key)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full text-label-caption font-label-caption transition-colors ${
                isSelected
                  ? "bg-[#2B2521] text-white font-medium shadow-xs"
                  : "text-[#241d18] hover:bg-[#F4F3EE]"
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-xs font-medium ${
                  isSelected ? "bg-white text-[#241d18] font-semibold" : "bg-[#F4F3EE] text-[#5C544F] border border-[#d8d0c0]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Group 2: Status */}
      <div className="flex flex-col gap-1.5 pt-4 border-t border-[#d8d0c0]">
        <div className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] uppercase tracking-wider mb-1 font-semibold">
          Status
        </div>
        {statusOptions.map((opt) => {
          const isSelected = selectedStatus === opt.key;
          const count = opt.key === "all" ? totalCount : statusCounts[opt.key] || 0;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSelectStatus(opt.key)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full text-label-caption font-label-caption transition-colors ${
                isSelected
                  ? "bg-[#2B2521] text-white font-medium shadow-xs"
                  : "text-[#241d18] hover:bg-[#F4F3EE]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${opt.dotColor}`}></span>
                {opt.label}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-xs font-medium ${
                  isSelected ? "bg-white text-[#241d18] font-semibold" : "bg-[#F4F3EE] text-[#5C544F] border border-[#d8d0c0]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
