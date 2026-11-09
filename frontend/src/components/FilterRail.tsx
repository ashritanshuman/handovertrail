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
    { key: "all", label: "All", dotColor: "bg-[#8A817C]" },
    { key: "verified", label: "Verified", dotColor: "bg-[#5F7A61]" },
    { key: "inferred", label: "Inferred", dotColor: "bg-[#6B7F94]" },
    { key: "conflicting", label: "Conflicting", dotColor: "bg-[#C9822B]" },
    { key: "missing", label: "Missing evidence", dotColor: "bg-[#8A817C]" },
  ];

  return (
    <aside
      className={`bg-white border border-[#E7E4DE] rounded-xl p-5 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col gap-6 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DE]">
        <h2 className="text-headline-section font-headline-section text-[#463F3A]">Filters</h2>
        <Filter size={16} className="text-[#8A817C]" />
      </div>

      {/* Filter Group 1: Type */}
      <div className="flex flex-col gap-1.5">
        <div className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C] uppercase tracking-wider mb-1">
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
                  ? "bg-[#463F3A] text-white font-medium shadow-xs"
                  : "text-[#463F3A] hover:bg-[#F4F3EE]"
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                  isSelected ? "bg-white/20 text-white" : "bg-[#F4F3EE] text-[#8A817C]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Group 2: Status */}
      <div className="flex flex-col gap-1.5 pt-4 border-t border-[#E7E4DE]">
        <div className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C] uppercase tracking-wider mb-1">
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
                  ? "bg-[#463F3A] text-white font-medium shadow-xs"
                  : "text-[#463F3A] hover:bg-[#F4F3EE]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${opt.dotColor}`}></span>
                {opt.label}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                  isSelected ? "bg-white/20 text-white" : "bg-[#F4F3EE] text-[#8A817C]"
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
