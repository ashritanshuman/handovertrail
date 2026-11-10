import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { FilterRail } from "../components/FilterRail";
import { ClaimCard } from "../components/ClaimCard";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { InlineEditDialog } from "../components/InlineEditDialog";
import { EmptyState } from "../components/EmptyState";
import { useHandover } from "../context/HandoverContext";
import { Claim, ClaimType } from "../types";

export const ReviewPage: React.FC = () => {
  const {
    claims,
    currentUser,
    selectedClaim,
    selectedEvidence,
    openEvidenceDrawer,
    closeEvidenceDrawer,
    editClaim,
    approveHandover,
  } = useHandover();

  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);

  // Compute counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    claims.forEach((c) => {
      counts[c.type] = (counts[c.type] || 0) + 1;
    });
    return counts;
  }, [claims]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    claims.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [claims]);

  // Filtered claims
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      if (selectedType !== "all" && c.type !== selectedType) return false;
      if (selectedStatus !== "all" && c.status !== selectedStatus) return false;
      if (unreviewedOnly && c.review_state !== "draft") return false;
      return true;
    });
  }, [claims, selectedType, selectedStatus, unreviewedOnly]);

  const totalClaims = claims.length;
  const reviewedCount = claims.filter(
    (c) => c.review_state && c.review_state !== "draft"
  ).length;
  const unreviewedCount = totalClaims - reviewedCount;
  const conflictingCount = claims.filter((c) => c.status === "conflicting").length;
  const reviewPct = totalClaims > 0 ? Math.round((reviewedCount / totalClaims) * 100) : 0;

  const handleEditSave = async (id: string, text: string, quote?: string, type?: ClaimType) => {
    await editClaim(id, text, quote, type);
  };

  const handleApprove = async (notes: string) => {
    await approveHandover(notes);
  };

  const isLead = currentUser.role === "lead";

  return (
    <AppShell>
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#d8d0c0]">
        <div>
          <h1 className="text-headline-page font-headline-page text-[#241d18] tracking-tight font-semibold">
            Review workspace
          </h1>
          <p className="text-body-default font-body-default text-[#5C544F] mt-1">
            CampusConnect project handover verification · {totalClaims} total claims extracted from Slack, PRs, and Notion
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] uppercase tracking-wider font-semibold">
            Session Ref:
          </span>
          <span className="text-label-mono-metadata font-label-mono-metadata bg-white px-2 py-1 rounded border border-[#d8d0c0] text-[#241d18] font-medium">
            CAMPUS-CC-2024Q4
          </span>
        </div>
      </section>

      {/* Three-Pane Inspection Workspace */}
      <div className="grid grid-cols-12 gap-6 items-start mt-6 pb-24">
        {/* Left Pane: Filters (2 cols on lg) */}
        <div className="col-span-12 lg:col-span-3">
          <FilterRail
            selectedType={selectedType}
            onSelectType={setSelectedType}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            typeCounts={typeCounts}
            statusCounts={statusCounts}
            totalCount={totalClaims}
          />
        </div>

        {/* Center Pane: Claims Stream (5 cols on lg) */}
        <section className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          {/* Controls Bar */}
          <div className="bg-white border border-[#d8d0c0] rounded-xl px-5 py-3 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-headline-section font-headline-section text-[#241d18] font-semibold">Claims</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F4F3EE] border border-[#d8d0c0] text-[#241d18] text-label-caption font-label-caption font-medium">
                {filteredClaims.length} shown
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setUnreviewedOnly(false)}
                className={`px-3 py-1 rounded-md text-label-caption font-label-caption transition-colors ${
                  !unreviewedOnly ? "bg-[#2B2521] text-white font-medium" : "text-[#413934] hover:text-[#241d18]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setUnreviewedOnly(true)}
                className={`px-3 py-1 rounded-md text-label-caption font-label-caption transition-colors ${
                  unreviewedOnly ? "bg-[#2B2521] text-white font-medium" : "text-[#413934] hover:text-[#241d18]"
                }`}
              >
                Unreviewed
              </button>
            </div>
          </div>

          {/* Stream Cards */}
          {filteredClaims.length === 0 ? (
            <EmptyState
              title="No claims match filters"
              description="Try resetting your Type and Status filters to inspect other extracted items."
              actionText="Reset filters"
              onAction={() => {
                setSelectedType("all");
                setSelectedStatus("all");
                setUnreviewedOnly(false);
              }}
            />
          ) : (
            <div className="flex flex-col gap-3.5">
              {filteredClaims.map((claim) => (
                <ClaimCard
                  key={claim.id}
                  claim={claim}
                  isSelected={selectedClaim?.id === claim.id}
                  onSelect={(c) => openEvidenceDrawer(c)}
                  onEdit={(c) => setEditingClaim(c)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right Pane: Evidence Drawer (4 cols on lg) */}
        <div className="col-span-12 lg:col-span-4">
          <EvidenceDrawer
            claim={selectedClaim}
            evidence={selectedEvidence}
            onClose={() => closeEvidenceDrawer()}
          />
        </div>
      </div>

      {/* Sticky Bottom Docked Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#d8d0c0] shadow-[0_-2px_10px_rgba(70,63,58,0.04)]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left side: Review progress metric */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-body-medium font-body-medium text-[#241d18] font-semibold">
                {reviewedCount} of {totalClaims} reviewed
              </span>
              <span className="text-label-mono-metadata font-label-mono-metadata text-[#5C544F]">
                ({reviewPct}%)
              </span>
            </div>
            {/* Thin progress bar */}
            <div className="w-36 h-2 rounded-full bg-[#d8d0c0] overflow-hidden flex">
              <div
                className="h-full bg-[#38523A] rounded-full transition-all duration-300"
                style={{ width: `${reviewPct}%` }}
              ></div>
            </div>
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <Link
              to="/handover"
              className="px-4 py-2 rounded-lg border border-[#d8d0c0] text-[#241d18] text-body-medium font-body-medium hover:bg-[#F4F3EE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#241d18]"
            >
              Export audit report
            </Link>

            {isLead ? (
              <button
                type="button"
                onClick={() => setConfirmApproveOpen(true)}
                className="px-5 py-2 rounded-lg bg-[#2B2521] hover:bg-[#1f1a17] text-white text-body-medium font-body-medium transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2"
              >
                Approve handover
              </button>
            ) : (
              <div className="text-xs text-[#5C544F] font-medium">
                Approval restricted to Maya Patel (Lead)
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Confirmation Dialog on Approval */}
      <ConfirmDialog
        isOpen={confirmApproveOpen}
        onClose={() => setConfirmApproveOpen(false)}
        onConfirm={handleApprove}
        unreviewedCount={unreviewedCount}
        conflictingCount={conflictingCount}
      />

      {/* Inline Edit Dialog */}
      <InlineEditDialog
        claim={editingClaim}
        isOpen={editingClaim !== null}
        onClose={() => setEditingClaim(null)}
        onSave={handleEditSave}
      />
    </AppShell>
  );
};
