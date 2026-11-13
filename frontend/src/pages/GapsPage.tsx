import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Sparkles, AlertTriangle, ShieldCheck, HelpCircle, Layers, RefreshCw } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { GapCard } from "../components/GapCard";
import { EmptyState } from "../components/EmptyState";
import { InterviewStepFlow } from "../components/conflicts/InterviewStepFlow";
import { ConflictTopicList } from "../components/conflicts/ConflictTopicList";
import { ConflictDetailPanel } from "../components/conflicts/ConflictDetailPanel";
import { useHandover } from "../context/HandoverContext";
import { api } from "../lib/api";
import { ConflictGroup } from "../types";

export const GapsPage: React.FC = () => {
  const { gaps, currentUser, refreshData } = useHandover();

  // Top-level sub-tabs
  const isLead = currentUser.role === "lead" || currentUser.id === "maya";
  const isLeaver = currentUser.role === "leaver" || currentUser.id === "riya";
  const isSuccessor = currentUser.role === "successor" || currentUser.id === "arjun";

  // Initial active sub-tab: leaver defaults to interview, lead defaults to conflicts, successor defaults to gaps
  const [activeTab, setActiveTab] = useState<"interview" | "conflicts" | "all_gaps">(() => {
    if (isLeaver) return "interview";
    if (isLead) return "conflicts";
    return "all_gaps";
  });

  // Conflicts state for Maya
  const [conflicts, setConflicts] = useState<ConflictGroup[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictGroup | null>(null);
  const [conflictsLoading, setConflictsLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Legacy gaps filter/search state
  const [gapFilterState, setGapFilterState] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConflicts = useCallback(async () => {
    if (!isLead) return;
    try {
      setConflictsLoading(true);
      const data = await api.getConflicts();
      setConflicts(data);
      if (data.length > 0) {
        // Keep selected if exists, else first
        setSelectedConflict((prev) => {
          if (prev) {
            const updated = data.find((c) => c.id === prev.id);
            if (updated) return updated;
          }
          return data[0];
        });
      }
    } catch (err) {
      console.error("Failed to load conflicts:", err);
    } finally {
      setConflictsLoading(false);
    }
  }, [isLead]);

  useEffect(() => {
    if (isLead) {
      fetchConflicts();
    }
  }, [isLead, fetchConflicts]);

  const handleRunDetection = async () => {
    try {
      setDetecting(true);
      const data = await api.detectConflicts();
      setConflicts(data);
      if (data.length > 0) {
        setSelectedConflict(data[0]);
      }
      refreshData();
    } catch (err) {
      console.error("Failed to run conflict detection:", err);
    } finally {
      setDetecting(false);
    }
  };

  const openConflictsCount = conflicts.filter((c) => c.status === "open").length;
  const openGapsCount = gaps.filter((g) => g.state === "open" && !g.answer).length;
  const answeredGapsCount = gaps.filter((g) => g.state === "answered" || Boolean(g.answer)).length;

  const filteredGaps = useMemo(() => {
    return gaps.filter((g) => {
      const isAns = g.state === "answered" || Boolean(g.answer);
      if (gapFilterState === "open" && isAns) return false;
      if (gapFilterState === "answered" && !isAns) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        g.text.toLowerCase().includes(q) ||
        (g.answer && g.answer.toLowerCase().includes(q)) ||
        g.id.toLowerCase().includes(q)
      );
    });
  }, [gaps, gapFilterState, searchQuery]);

  return (
    <AppShell>
      {/* Dossier Header */}
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
              Knowledge Gaps &amp; Conflict Resolution
            </h1>
            <p className="text-body-default font-body-default text-[#5C544F] mt-1 max-w-2xl">
              Multi-source contradiction detection, guided exit interview, and lead reconciliation before handover sign-off.
            </p>
          </div>

          {/* Stats Badges */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto bg-white border border-[#d8d0c0] rounded-xl px-4 py-2 shadow-xs">
            {isLead && (
              <>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#8D3B2A] font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {openConflictsCount} open conflicts
                </span>
                <span className="text-[#d8d0c0]">·</span>
              </>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-[#8F5105] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#8F5105]"></span>
              {openGapsCount} open gaps
            </span>
            <span className="text-[#d8d0c0]">·</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#1E6B42] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#1E6B42]"></span>
              {answeredGapsCount} answered
            </span>
          </div>
        </div>
      </section>

      {/* Role Notice for Successor Arjun */}
      {isSuccessor && (
        <div className="my-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-slate-600 shrink-0" />
          <p className="text-xs text-slate-800 leading-relaxed">
            <strong>Successor View:</strong> Knowledge gaps and contradictions are reviewed and reconciled by lead Maya Patel and leaver Riya Sharma. Once signed off, all approved claims and decisions are published to your Handover View.
          </p>
        </div>
      )}

      {/* Primary Workspace Navigation Tabs */}
      {!isSuccessor && (
        <div className="flex items-center gap-2 border-b border-[#d8d0c0] my-6">
          {/* Exit Interview Tab (Leaver & Lead) */}
          <button
            type="button"
            onClick={() => setActiveTab("interview")}
            className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === "interview"
                ? "text-[#8D3B2A] border-b-2 border-[#8D3B2A]"
                : "text-[#665E55] hover:text-[#241D18]"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Exit Interview</span>
            {isLeaver && (
              <span className="bg-[#8D3B2A]/10 text-[#8D3B2A] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                Leaver Focus
              </span>
            )}
          </button>

          {/* Conflict Resolution Tab (Lead Only) */}
          {isLead && (
            <button
              type="button"
              onClick={() => setActiveTab("conflicts")}
              className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
                activeTab === "conflicts"
                  ? "text-[#8D3B2A] border-b-2 border-[#8D3B2A]"
                  : "text-[#665E55] hover:text-[#241D18]"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Conflict Resolution Workspace</span>
              {openConflictsCount > 0 && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {openConflictsCount}
                </span>
              )}
            </button>
          )}

          {/* All Gaps Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("all_gaps")}
            className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
              activeTab === "all_gaps"
                ? "text-[#8D3B2A] border-b-2 border-[#8D3B2A]"
                : "text-[#665E55] hover:text-[#241D18]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Gap Items ({gaps.length})</span>
          </button>
        </div>
      )}

      {/* TAB 1: EXIT INTERVIEW */}
      {activeTab === "interview" && !isSuccessor && (
        <div className="pb-12">
          <InterviewStepFlow
            onComplete={() => {
              refreshData();
              if (isLead) fetchConflicts();
            }}
            onRefresh={() => {
              refreshData();
              if (isLead) fetchConflicts();
            }}
          />
        </div>
      )}

      {/* TAB 2: CONFLICT RESOLUTION WORKSPACE (LEAD ONLY) */}
      {activeTab === "conflicts" && isLead && (
        <div className="space-y-6 pb-12">
          {/* Top toolbar */}
          <div className="flex items-center justify-between gap-4 bg-white border border-[#d8d0c0] rounded-xl p-3 shadow-xs">
            <div>
              <p className="text-xs font-bold text-[#241D18]">
                Multi-Attribute Conflict Engine
              </p>
              <p className="text-[11px] text-[#665E55]">
                Compares statements across GitHub, Jira, Slack and Notes. Handover approval is gated until open conflicts are resolved or acknowledged.
              </p>
            </div>
            <button
              type="button"
              disabled={detecting}
              onClick={handleRunDetection}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#241D18] hover:bg-black rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${detecting ? "animate-spin" : ""}`} />
              {detecting ? "Analyzing..." : "Re-run Detection"}
            </button>
          </div>

          {/* 2-Pane Split: Left = Topic List, Right = Comparison & Resolution Panel */}
          {conflictsLoading ? (
            <div className="bg-white border border-[#d8d0c0] rounded-xl p-12 text-center text-[#665E55]">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D3B2A] mb-3"></div>
              <p className="text-sm font-medium">Loading project conflicts...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (5 cols) */}
              <div className="lg:col-span-5">
                <ConflictTopicList
                  conflicts={conflicts}
                  selectedConflictId={selectedConflict?.id || null}
                  onSelectConflict={(c) => setSelectedConflict(c)}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  typeFilter={typeFilter}
                  onTypeFilterChange={setTypeFilter}
                />
              </div>

              {/* Right Column (7 cols) */}
              <div className="lg:col-span-7">
                {selectedConflict ? (
                  <ConflictDetailPanel
                    conflict={selectedConflict}
                    onResolved={() => {
                      fetchConflicts();
                      refreshData();
                    }}
                  />
                ) : (
                  <div className="bg-white border border-[#E5E0D8] rounded-xl p-12 text-center text-[#665E55]">
                    <HelpCircle className="h-10 w-10 text-[#A89F91] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#241D18]">Select a conflict topic</p>
                    <p className="text-xs mt-1">Choose a topic from the left list to inspect side-by-side evidence quotes and choose a resolution.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALL GAPS (OR SUCCESSOR VIEW) */}
      {(activeTab === "all_gaps" || isSuccessor) && (
        <div className="space-y-6 pb-12">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-[#d8d0c0] rounded-xl p-3 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setGapFilterState("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-colors ${
                  gapFilterState === "all"
                    ? "bg-[#2B2521] text-white font-medium"
                    : "text-[#5C544F] hover:text-[#241d18] hover:bg-[#F4F3EE]"
                }`}
              >
                All gaps ({gaps.length})
              </button>
              <button
                type="button"
                onClick={() => setGapFilterState("open")}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-colors ${
                  gapFilterState === "open"
                    ? "bg-[#8F5105] text-white font-medium"
                    : "text-[#5C544F] hover:text-[#8F5105] hover:bg-[#F4F3EE]"
                }`}
              >
                Open ({openGapsCount})
              </button>
              <button
                type="button"
                onClick={() => setGapFilterState("answered")}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-colors ${
                  gapFilterState === "answered"
                    ? "bg-[#1E6B42] text-white font-medium"
                    : "text-[#5C544F] hover:text-[#1E6B42] hover:bg-[#F4F3EE]"
                }`}
              >
                Answered ({answeredGapsCount})
              </button>
            </div>

            {/* Quick Filter Search Input */}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B635E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by keyword or question..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#d8d0c0] bg-white text-xs text-[#241d18] focus:border-[#2B2521] focus:outline-none focus:ring-1 focus:ring-[#2B2521] transition-colors"
              />
            </div>
          </div>

          {/* Gaps List */}
          <div className="space-y-4">
            {filteredGaps.length === 0 ? (
              <EmptyState
                title="No gaps match filter"
                description="All questions have either been reconciled or no open items match your current search terms."
                actionText="View all gaps"
                onAction={() => {
                  setGapFilterState("all");
                  setSearchQuery("");
                }}
              />
            ) : (
              filteredGaps.map((gap) => <GapCard key={gap.id} gap={gap} />)
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
};
