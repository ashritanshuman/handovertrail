import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { GapCard } from "../components/GapCard";
import { EmptyState } from "../components/EmptyState";
import { useHandover } from "../context/HandoverContext";

export const GapsPage: React.FC = () => {
  const { gaps } = useHandover();
  const [filterState, setFilterState] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const openCount = gaps.filter((g) => g.state === "open" && !g.answer).length;
  const answeredCount = gaps.filter((g) => g.state === "answered" || Boolean(g.answer)).length;

  const filteredGaps = useMemo(() => {
    return gaps.filter((g) => {
      const isAns = g.state === "answered" || Boolean(g.answer);
      if (filterState === "open" && isAns) return false;
      if (filterState === "answered" && !isAns) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        g.text.toLowerCase().includes(q) ||
        (g.answer && g.answer.toLowerCase().includes(q)) ||
        g.id.toLowerCase().includes(q)
      );
    });
  }, [gaps, filterState, searchQuery]);

  return (
    <AppShell>
      {/* Dossier Subheader */}
      <section className="pb-6 border-b border-[#d8d0c0]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-label-mono-metadata font-label-mono-metadata text-[#6B635E] tracking-wider uppercase mb-1">
              <span>PROJECT DOSSIER</span>
              <span className="text-[#d8d0c0]">•</span>
              <span>CAMPUS-CC-2024Q4</span>
              <span className="text-[#d8d0c0]">•</span>
              <span>LEAVER: RIYA SHARMA</span>
            </div>
            <h1 className="text-headline-page font-headline-page text-[#241d18] tracking-tight">
              Handover gaps &amp; discrepancies
            </h1>
            <p className="text-body-default font-body-default text-[#5C544F] mt-1 max-w-2xl">
              Identified contradictions, missing knowledge, and questions requiring Riya Sharma's clarification before sign-off.
            </p>
          </div>

          {/* Stats Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-white border border-[#d8d0c0] rounded-full px-4 py-2 shadow-[0_1px_2px_rgba(70,63,58,0.06)]">
            <span className="inline-flex items-center gap-1.5 text-label-caption font-label-caption text-[#8F5105] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#8F5105]"></span>
              {openCount} open gaps
            </span>
            <span className="text-[#d8d0c0]">·</span>
            <span className="inline-flex items-center gap-1.5 text-label-caption font-label-caption text-[#38523A] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#38523A]"></span>
              {answeredCount} answered
            </span>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-[#d8d0c0] rounded-xl p-3 my-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)]">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterState("all")}
            className={`px-3.5 py-1.5 rounded-full text-label-caption font-label-caption transition-colors ${
              filterState === "all"
                ? "bg-[#2B2521] text-white font-medium"
                : "text-[#5C544F] hover:text-[#241d18] hover:bg-[#F4F3EE]"
            }`}
          >
            All gaps ({gaps.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterState("open")}
            className={`px-3.5 py-1.5 rounded-full text-label-caption font-label-caption transition-colors ${
              filterState === "open"
                ? "bg-[#8F5105] text-white font-medium"
                : "text-[#5C544F] hover:text-[#8F5105] hover:bg-[#F4F3EE]"
            }`}
          >
            Open conflicts ({openCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterState("answered")}
            className={`px-3.5 py-1.5 rounded-full text-label-caption font-label-caption transition-colors ${
              filterState === "answered"
                ? "bg-[#38523A] text-white font-medium"
                : "text-[#5C544F] hover:text-[#38523A] hover:bg-[#F4F3EE]"
            }`}
          >
            Answered ({answeredCount})
          </button>
        </div>

        {/* Quick Filter Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B635E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by keyword, RFC, or tag..."
            className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-[#d8d0c0] bg-white text-body-default font-body-default text-[#241d18] focus:border-[#2B2521] focus:outline-none focus:ring-1 focus:ring-[#2B2521] transition-colors"
          />
        </div>
      </div>

      {/* Gaps List */}
      <div className="space-y-6 pb-12">
        {filteredGaps.length === 0 ? (
          <EmptyState
            title="No gaps match filter"
            description="All questions have either been reconciled or no open items match your current search terms."
            actionText="View all gaps"
            onAction={() => {
              setFilterState("all");
              setSearchQuery("");
            }}
          />
        ) : (
          filteredGaps.map((gap) => <GapCard key={gap.id} gap={gap} />)
        )}
      </div>
    </AppShell>
  );
};
