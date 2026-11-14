import React from "react";
import { AlertTriangle, CheckCircle2, Clock, Check, HelpCircle, Layers, ArrowRight } from "lucide-react";
import { ConflictGroup, ConflictStatus } from "../../types";

interface ConflictTopicListProps {
  conflicts: ConflictGroup[];
  selectedConflictId: string | null;
  onSelectConflict: (conflict: ConflictGroup) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
}

export const ConflictTopicList: React.FC<ConflictTopicListProps> = ({
  conflicts,
  selectedConflictId,
  onSelectConflict,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
}) => {
  // Counts by status
  const totalCount = conflicts.length;
  const openCount = conflicts.filter((c) => c.status === "open").length;
  const resolvedCount = conflicts.filter((c) => c.status === "resolved").length;
  const dismissedCount = conflicts.filter((c) => c.status === "dismissed").length;
  const unresolvedCount = conflicts.filter((c) => c.status === "unresolved").length;

  const filteredConflicts = conflicts.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    return true;
  });

  const getStatusBadge = (status: ConflictStatus) => {
    switch (status) {
      case "open":
        return (
          <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-600" /> Open
          </span>
        );
      case "resolved":
        return (
          <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Resolved
          </span>
        );
      case "dismissed":
        return (
          <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Check className="h-3 w-3 text-gray-500" /> Dismissed
          </span>
        );
      case "unresolved":
        return (
          <span className="text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-rose-600" /> Unresolved
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E5E0D8] pb-3">
        {[
          { key: "all", label: "All", count: totalCount },
          { key: "open", label: "Open", count: openCount, badgeColor: "text-amber-800 bg-amber-100" },
          { key: "resolved", label: "Resolved", count: resolvedCount, badgeColor: "text-emerald-800 bg-emerald-100" },
          { key: "dismissed", label: "Dismissed", count: dismissedCount, badgeColor: "text-gray-700 bg-gray-200" },
          { key: "unresolved", label: "Unresolved", count: unresolvedCount, badgeColor: "text-rose-800 bg-rose-100" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => onStatusFilterChange(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? "bg-[#241D18] text-white shadow-sm"
                : "bg-white text-[#665E55] hover:bg-[#FAFAF8] border border-[#E5E0D8]"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.key ? "bg-white/20 text-white" : tab.badgeColor || "bg-[#E5E0D8] text-[#241D18]"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Type Filter Select */}
      <div className="flex items-center justify-between text-xs text-[#665E55]">
        <span>Showing {filteredConflicts.length} of {totalCount} conflict topics</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="text-xs bg-white border border-[#E5E0D8] rounded-md px-2 py-1 text-[#241D18] focus:outline-none focus:ring-1 focus:ring-[#8D3B2A]"
          >
            <option value="all">All Types</option>
            <option value="contradiction">Contradictions</option>
            <option value="supersession">Supersessions</option>
          </select>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="space-y-2.5">
        {filteredConflicts.length === 0 ? (
          <div className="bg-white border border-[#E5E0D8] rounded-xl p-8 text-center text-[#665E55]">
            <HelpCircle className="h-8 w-8 text-[#A89F91] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#241D18]">No conflicts match this filter</p>
            <p className="text-xs mt-1">Switch status filter to view all detected conflicts.</p>
          </div>
        ) : (
          filteredConflicts.map((c) => {
            const isSelected = c.id === selectedConflictId;
            const hasLeaverAnswer = Boolean(c.leaver_answer && c.leaver_answer.answer);

            return (
              <div
                key={c.id}
                onClick={() => onSelectConflict(c)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative ${
                  isSelected
                    ? "bg-[#FAFAF8] border-[#8D3B2A] ring-1 ring-[#8D3B2A] shadow-sm"
                    : "bg-white border-[#E5E0D8] hover:border-[#8D3B2A]/50 hover:bg-[#FAFAF8]/50"
                }`}
              >
                {/* Header row: Topic & Status */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-[#8D3B2A] uppercase tracking-wider">
                    {c.topic || "Conflict"}
                  </span>
                  <div>{getStatusBadge(c.status)}</div>
                </div>

                {/* Entity Name */}
                <h4 className="text-sm font-bold text-[#241D18] mb-2 leading-snug">
                  {c.entity}
                </h4>

                {/* Badges row: attribute, type, confidence, claims */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="bg-[#FAFAF8] text-[#665E55] border border-[#E5E0D8] px-2 py-0.5 rounded font-mono">
                    attr: {c.attribute}
                  </span>
                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded capitalize">
                    {c.type}
                  </span>
                  <span className="bg-white text-[#665E55] border border-[#E5E0D8] px-2 py-0.5 rounded flex items-center gap-1">
                    <Layers className="h-3 w-3 text-[#8C827A]" />
                    {c.claims.length} claims
                  </span>

                  {/* Leaver Answer Tag */}
                  {hasLeaverAnswer ? (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 font-medium ml-auto">
                      <CheckCircle2 className="h-3 w-3" /> Answered by Riya
                    </span>
                  ) : (
                    <span className="bg-amber-50/70 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded flex items-center gap-1 ml-auto">
                      <Clock className="h-3 w-3" /> Pending Answer
                    </span>
                  )}
                </div>

                {/* Selected arrow indicator */}
                {isSelected && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D3B2A]">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

