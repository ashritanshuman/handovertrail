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
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E7E4DE]">
        <div>
          <div className="flex items-center gap-2 text-label-mono-metadata font-label-mono-metadata text-[#8A817C] tracking-wider uppercase mb-1">
            <span>PROJECT DOSSIER</span>
            <span className="text-[#BCB8B1]">•</span>
            <span>CAMPUS-CC-2024Q4</span>
          </div>
          <h1 className="text-headline-page font-headline-page text-[#463F3A] tracking-tight">
            Chronological handover timeline
          </h1>
          <p className="text-body-default font-body-default text-[#8A817C] mt-1">
            Audit-grade history of engineering decisions, infrastructure PRs, and cross-source verification milestones.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A817C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milestones..."
              className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-[#BCB8B1] bg-white text-body-default font-body-default text-[#463F3A] focus:border-[#463F3A] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-full text-label-caption font-label-caption transition-colors ${
                filterType === "all"
                  ? "bg-[#463F3A] text-white font-medium"
                  : "bg-white text-[#8A817C] border border-[#E7E4DE]"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType("verified")}
              className={`px-3 py-1.5 rounded-full text-label-caption font-label-caption transition-colors ${
                filterType === "verified"
                  ? "bg-[#5F7A61] text-white font-medium"
                  : "bg-white text-[#8A817C] border border-[#E7E4DE]"
              }`}
            >
              Verified
            </button>
            <button
              type="button"
              onClick={() => setFilterType("conflicting")}
              className={`px-3 py-1.5 rounded-full text-label-caption font-label-caption transition-colors ${
                filterType === "conflicting"
                  ? "bg-[#C9822B] text-white font-medium"
                  : "bg-white text-[#8A817C] border border-[#E7E4DE]"
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
                  <div className="absolute left-[19px] top-12 bottom-0 w-[2px] bg-[#E7E4DE]"></div>

                  {/* Month Header */}
                  <div className="flex items-center gap-3 mb-6 pl-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E7E4DE] shadow-xs">
                      <Calendar size={14} className="text-[#463F3A]" />
                      <span className="text-headline-section font-headline-section text-[#463F3A] text-sm font-semibold">
                        {month}
                      </span>
                    </div>
                    <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
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
