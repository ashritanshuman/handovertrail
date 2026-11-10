import React, { useState, useMemo } from "react";
import { Search, Calendar } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { TimelineItem } from "../components/TimelineItem";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { EmptyState } from "../components/EmptyState";
import { useHandover } from "../context/HandoverContext";
import { TimelineEvent } from "../types";

export const TimelinePage: React.FC = () => {
  const { timeline, claims, selectedClaim, selectedEvidence, openEvidenceDrawer, closeEvidenceDrawer } =
    useHandover();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredTimeline = useMemo(() => {
    return timeline.filter((evt) => {
      const status = evt.status || "verified";
      if (filterType !== "all" && status !== filterType) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        evt.title.toLowerCase().includes(q) ||
        evt.summary.toLowerCase().includes(q) ||
        evt.source_ref.toLowerCase().includes(q)
      );
    });
  }, [timeline, searchQuery, filterType]);

  // Group by month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    filteredTimeline.forEach((evt) => {
      // evt.date is e.g. "2024-10-14" or "14 Oct 2024"
      let monthKey = "October 2024";
      if (evt.date.includes("Sep") || evt.date.includes("-09-")) {
        monthKey = "September 2024";
      } else if (evt.date.includes("Nov") || evt.date.includes("-11-")) {
        monthKey = "November 2024";
      }
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(evt);
    });
    return groups;
  }, [filteredTimeline]);

  const handleSelectEventSource = (evt: TimelineEvent) => {
    // Find matching claim
    const matchingClaim =
      claims.find((c) => c.text.toLowerCase().includes(evt.title.substring(0, 20).toLowerCase())) ||
      claims[0];
    if (matchingClaim) {
      openEvidenceDrawer(matchingClaim);
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#d8d0c0]">
        <div>
          <div className="flex items-center gap-2 text-label-mono-metadata font-label-mono-metadata text-[#6B635E] tracking-wider uppercase mb-1">
            <span>PROJECT DOSSIER</span>
            <span className="text-[#d8d0c0]">•</span>
            <span>CAMPUS-CC-2024Q4</span>
          </div>
          <h1 className="text-headline-page font-headline-page text-[#241d18] tracking-tight">
            Chronological handover timeline
          </h1>
          <p className="text-body-default font-body-default text-[#5C544F] mt-1">
            Audit-grade history of engineering decisions, infrastructure PRs, and cross-source verification milestones.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B635E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milestones..."
              className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-[#d8d0c0] bg-white text-body-default font-body-default text-[#241d18] focus:border-[#2B2521] focus:outline-none focus:ring-1 focus:ring-[#2B2521]"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-full text-label-caption font-label-caption transition-colors ${
                filterType === "all"
                  ? "bg-[#2B2521] text-white font-medium"
                  : "bg-white text-[#5C544F] border border-[#d8d0c0] hover:text-[#241d18]"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType("verified")}
              className={`px-3 py-1.5 rounded-full text-label-caption font-label-caption transition-colors ${
                filterType === "verified"
                  ? "bg-[#38523A] text-white font-medium"
                  : "bg-white text-[#5C544F] border border-[#d8d0c0] hover:text-[#38523A]"
              }`}
            >
              Verified
            </button>
            <button
              type="button"
              onClick={() => setFilterType("conflicting")}
              className={`px-3 py-1.5 rounded-full text-label-caption font-label-caption transition-colors ${
                filterType === "conflicting"
                  ? "bg-[#8F5105] text-white font-medium"
                  : "bg-white text-[#5C544F] border border-[#d8d0c0] hover:text-[#8F5105]"
              }`}
            >
              Conflicting
            </button>
          </div>
        </div>
      </section>

      {/* Main Timeline View */}
      <div className="grid grid-cols-12 gap-6 items-start mt-8">
        <div className="col-span-12 lg:col-span-8">
          {Object.keys(groupedByMonth).length === 0 ? (
            <EmptyState
              title="No milestones match query"
              description="Try adjusting your search keywords or resetting the status filters."
              actionText="Reset search"
              onAction={() => {
                setSearchQuery("");
                setFilterType("all");
              }}
            />
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedByMonth).map(([month, events]) => (
                <div key={month} className="relative">
                  {/* Vertical connecting line */}
                  <div className="absolute left-[19px] top-12 bottom-0 w-[2px] bg-[#d8d0c0]"></div>

                  {/* Month Header */}
                  <div className="flex items-center gap-3 mb-6 pl-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#d8d0c0] shadow-xs">
                      <Calendar size={14} className="text-[#241d18]" />
                      <span className="text-headline-section font-headline-section text-[#241d18] text-sm font-semibold">
                        {month}
                      </span>
                    </div>
                    <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E]">
                      {events.length} recorded events
                    </span>
                  </div>

                  {/* Events */}
                  <div className="space-y-6">
                    {events.map((evt, idx) => (
                      <TimelineItem
                        key={evt.id || `${evt.date}-${idx}`}
                        event={evt}
                        onSelectSource={handleSelectEventSource}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Pane: Evidence Drawer */}
        <div className="col-span-12 lg:col-span-4">
          <EvidenceDrawer
            claim={selectedClaim}
            evidence={selectedEvidence}
            onClose={() => closeEvidenceDrawer()}
          />
        </div>
      </div>
    </AppShell>
  );
};
