import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  RefreshCw,
  Share2,
  Lock,
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { AppShell } from "../../components/AppShell";
import { HiddenItemsBanner } from "../../components/HiddenItemsBanner";
import { EvidenceDrawer } from "../../components/EvidenceDrawer";
import { PlanBoard, ShareCheckPanel, HiddenItemsPanel } from "../../components/plan";
import { useHandover } from "../../context/HandoverContext";
import { api } from "../../lib/api";
import {
  PreviewResponse,
  PlanItem,
  Claim,
} from "../../types";

export const PreviewPage: React.FC = () => {
  const { currentUser, switchUser, showToast, claims: contextClaims } = useHandover();
  const isLead = currentUser.role === "lead";

  const [mode, setMode] = useState<"draft" | "approved">("draft");
  const [loading, setLoading] = useState<boolean>(true);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [regenerating, setRegenerating] = useState<boolean>(false);

  // Regeneration modal state
  const [isRegenModalOpen, setIsRegenModalOpen] = useState<boolean>(false);
  const [roleTitle, setRoleTitle] = useState<string>("Backend Engineer");
  const [focusAreasText, setFocusAreasText] = useState<string>("Stripe, Vault, Redis, APNs");

  // Publish confirmation modal state
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState<boolean>(false);
  const [ackWarningsChecked, setAckWarningsChecked] = useState<boolean>(false);

  // Evidence Drawer state
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const fetchPreview = useCallback(async (currentMode: "draft" | "approved") => {
    setLoading(true);
    try {
      const data = await api.getPreview(currentMode);
      setPreviewData(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load preview data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isLead) {
      fetchPreview(mode);
    }
  }, [isLead, mode, fetchPreview]);

  const handleModeChange = (newMode: "draft" | "approved") => {
    setMode(newMode);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const focusAreas = focusAreasText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await api.generatePlan(roleTitle, focusAreas);
      showToast("First-7-Days Onboarding Plan regenerated successfully", "success");
      setIsRegenModalOpen(false);
      await fetchPreview(mode);
    } catch (err: any) {
      showToast(err.message || "Plan generation failed", "error");
    } finally {
      setRegenerating(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await api.publishPlan(ackWarningsChecked);
      showToast("Handover Plan published successfully to successor", "success");
      setIsPublishDialogOpen(false);
      setMode("approved");
      await fetchPreview("approved");
    } catch (err: any) {
      showToast(err.message || "Failed to publish plan", "error");
    } finally {
      setPublishing(false);
    }
  };

  const handleMoveDay = async (itemId: string, newDay: number) => {
    try {
      await api.updatePlanItem(itemId, { day: newDay });
      await fetchPreview(mode);
      showToast(`Item moved to Day ${newDay}`, "info");
    } catch (err: any) {
      showToast(err.message || "Failed to move item", "error");
    }
  };

  const handleUpdateItem = async (itemId: string, patch: Partial<PlanItem>) => {
    try {
      await api.updatePlanItem(itemId, patch);
      await fetchPreview(mode);
      showToast("Plan item updated", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update item", "error");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await api.deletePlanItem(itemId);
      await fetchPreview(mode);
      showToast("Plan item removed", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to remove item", "error");
    }
  };

  const handleSelectClaim = (claimId: string) => {
    const claim = contextClaims.find((c) => c.id === claimId) || {
      id: claimId,
      project_id: "campusconnect",
      type: "task",
      text: `Claim ${claimId}`,
      owner: "Team",
      status: "verified",
      evidence_ids: [],
      quote: "",
      access_level: 1,
      review_state: "confirmed",
      version: 1,
      origin: "cache",
    };
    setSelectedClaim(claim as Claim);
  };

  // If user is not lead (e.g. Arjun or Riya), show strict lead-only gate
  if (!isLead) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-16">
          <div className="bg-white border border-[#d8d0c0] rounded-2xl p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#E0AFA0]/20 text-[#8d3b2a] flex items-center justify-center mx-auto">
              <Lock size={22} />
            </div>
            <h2 className="text-headline-page font-headline-page text-[#241d18] font-medium">
              Lead Authorization Required
            </h2>
            <p className="text-body-default text-[#5C544F] leading-relaxed">
              The <strong>Preview-as-Successor</strong> workspace and <strong>Share Check audit</strong> are
              restricted to Maya Patel (Team Lead) to guarantee zero pre-publication leakage.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => switchUser("maya")}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2B2521] hover:bg-[#1f1a17] text-white text-sm font-medium transition-colors inline-flex items-center justify-center gap-2"
              >
                <span>Switch to Maya Patel (Lead)</span>
                <ArrowRight size={16} />
              </button>
              <Link
                to="/handover"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#d8d0c0] hover:bg-[#F4F3EE] text-[#241d18] text-sm font-medium transition-colors inline-flex items-center justify-center"
              >
                Go to Successor Handover View
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const handover = previewData?.handover;
  const plan = handover?.plan;
  const shareCheck = previewData?.share_check || null;
  const canPublish = shareCheck ? shareCheck.can_publish : false;
  const hasWarnings = shareCheck ? shareCheck.warn_count > 0 : false;

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto py-6 space-y-6">
        {/* Top Banner: Preview Persona Notification */}
        <div className="bg-white border border-[#d8d0c0] rounded-2xl p-5 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2B2521] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Eye size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B635E] font-semibold">
                  PREVIEW-AS-SUCCESSOR MODE
                </span>
                <span className="text-[#d8d0c0]">·</span>
                <span className="text-xs font-mono font-medium text-[#38523A] bg-[#EEF6EF] px-2 py-0.5 rounded-full border border-[#B5D8B8]">
                  Clearance 1 Active
                </span>
              </div>
              <h1 className="text-lg font-semibold text-[#241d18]">
                Previewing exactly what <strong className="font-bold">Arjun Rao</strong> will see
              </h1>
            </div>
          </div>

          {/* Mode Switcher + Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Mode Switcher */}
            <div className="inline-flex rounded-xl bg-[#F4F3EE] p-1 border border-[#d8d0c0]">
              <button
                type="button"
                onClick={() => handleModeChange("draft")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mode === "draft"
                    ? "bg-white text-[#241d18] shadow-xs"
                    : "text-[#5C544F] hover:text-[#241d18]"
                }`}
              >
                Draft Preview
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("approved")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mode === "approved"
                    ? "bg-white text-[#241d18] shadow-xs"
                    : "text-[#5C544F] hover:text-[#241d18]"
                }`}
              >
                Ratified Snapshot
              </button>
            </div>

            {/* Regenerate Plan Button */}
            <button
              type="button"
              onClick={() => setIsRegenModalOpen(true)}
              disabled={regenerating}
              className="px-3.5 py-2 rounded-xl border border-[#d8d0c0] hover:bg-[#F4F3EE] text-[#241d18] text-xs font-medium transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={regenerating ? "animate-spin" : ""} />
              <span>Regenerate Plan</span>
            </button>

            {/* Publish Plan Button */}
            <button
              type="button"
              disabled={!canPublish || publishing}
              onClick={() => setIsPublishDialogOpen(true)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-xs ${
                canPublish
                  ? "bg-[#2B2521] hover:bg-[#1f1a17] text-white"
                  : "bg-[#EBE8E0] text-[#8A817C] cursor-not-allowed"
              }`}
              title={canPublish ? "Publish plan to successor" : "Resolve Block findings before publishing"}
            >
              <Share2 size={13} />
              <span>Publish Plan</span>
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Successor Handover View (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Handover Dossier Header Card */}
            <div className="bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE8E0] pb-3 text-xs font-mono text-[#6B635E]">
                <span>CAMPUS-CC-2024Q4 · HANDOVER DOSSIER</span>
                <span className="font-semibold text-[#241d18]">
                  VERSION: {handover?.version || "Draft"}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-[#241d18]">
                  CampusConnect Engineering Handover
                </h2>
                <p className="text-xs text-[#5C544F] mt-1">
                  Prepared by departing staff engineer Riya Sharma · Filtered for incoming engineer Arjun Rao
                </p>
              </div>

              {/* Hidden Items Banner */}
              <HiddenItemsBanner hiddenCount={handover?.hidden_count || 0} />
            </div>

            {/* Section 1: First 7 Days Onboarding Plan */}
            <div className="bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#d8d0c0]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#2B2521] text-white flex items-center justify-center text-xs font-mono font-bold">
                    01
                  </span>
                  <h3 className="text-base font-semibold text-[#241d18]">
                    First 7 Days Onboarding Action Plan
                  </h3>
                </div>

                {plan?.role_title && (
                  <span className="text-xs font-mono text-[#6B635E] bg-[#F4F3EE] px-2.5 py-0.5 rounded border border-[#d8d0c0]">
                    Role: {plan.role_title}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-[#6B635E] animate-pulse">
                  Loading successor preview...
                </div>
              ) : !plan || plan.items.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8A817C] bg-[#FBFBFA] rounded-xl border border-dashed border-[#d8d0c0] space-y-2">
                  <p>No onboarding plan generated yet.</p>
                  <button
                    type="button"
                    onClick={() => setIsRegenModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#2B2521] text-white text-xs font-medium"
                  >
                    Generate Initial Plan
                  </button>
                </div>
              ) : (
                <PlanBoard
                  items={plan.items}
                  isLead={true}
                  onMoveDay={handleMoveDay}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onSelectClaim={handleSelectClaim}
                />
              )}
            </div>

            {/* Handover Sections Preview */}
            {handover?.sections && (
              <div className="space-y-4">
                {Object.entries(handover.sections).map(([secKey, secClaims], idx) => {
                  if (!secClaims || secClaims.length === 0) return null;
                  return (
                    <div
                      key={secKey}
                      className="bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#EBE8E0]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-[#F4F3EE] flex items-center justify-center text-[11px] font-mono font-bold text-[#241d18]">
                            0{idx + 2}
                          </span>
                          <h4 className="text-sm font-semibold capitalize text-[#241d18]">
                            {secKey.replace("_", " ")}
                          </h4>
                        </div>
                        <span className="text-xs font-mono text-[#6B635E]">
                          {secClaims.length} Claims
                        </span>
                      </div>

                      <div className="space-y-2">
                        {secClaims.map((claim) => (
                          <div
                            key={claim.id}
                            className="p-3 rounded-xl border border-[#d8d0c0] bg-[#FDFCF7] text-xs flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <p className="font-medium text-[#241d18]">{claim.text}</p>
                              {claim.quote && (
                                <p className="text-[11px] text-[#6B635E] italic">
                                  &ldquo;{claim.quote}&rdquo;
                                </p>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-[#6B635E] bg-white px-1.5 py-0.5 rounded border border-[#d8d0c0] shrink-0">
                              {claim.id}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar: Share Check Audit & Hidden Items Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <ShareCheckPanel shareCheck={shareCheck} loading={loading} />
            <HiddenItemsPanel
              hiddenItems={previewData?.hidden_items || []}
              confidentialCount={previewData?.confidential_count || 0}
            />
          </div>
        </div>
      </div>

      {/* Regeneration Modal */}
      {isRegenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in backdrop-blur-xs">
          <div className="bg-white border border-[#d8d0c0] rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#241d18]">
              <Sparkles size={16} className="text-[#8d3b2a]" />
              <span>Regenerate 7-Day Onboarding Plan</span>
            </div>

            <p className="text-xs text-[#5C544F] leading-relaxed">
              Customizes the deterministic sequencing engine by tailoring actions to the incoming engineer&apos;s
              specific role and focus topics.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#413934] mb-1">
                  Successor Role Title
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Backend Engineer, Systems Lead"
                  className="w-full px-3 py-2 rounded-lg border border-[#d8d0c0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2521]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#413934] mb-1">
                  Focus Areas (comma-separated)
                </label>
                <input
                  type="text"
                  value={focusAreasText}
                  onChange={(e) => setFocusAreasText(e.target.value)}
                  placeholder="Stripe, Vault, Redis, APNs"
                  className="w-full px-3 py-2 rounded-lg border border-[#d8d0c0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2521]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBE8E0]">
              <button
                type="button"
                onClick={() => setIsRegenModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#d8d0c0] text-xs font-medium text-[#5C544F] hover:bg-[#F4F3EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={regenerating}
                onClick={handleRegenerate}
                className="px-4 py-2 rounded-lg bg-[#2B2521] text-white text-xs font-medium hover:bg-[#1f1a17] inline-flex items-center gap-1.5"
              >
                <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
                <span>{regenerating ? "Generating..." : "Generate Plan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Plan Confirmation Dialog */}
      {isPublishDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in backdrop-blur-xs">
          <div className="bg-white border border-[#d8d0c0] rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#241d18]">
              <Share2 size={16} className="text-[#38523A]" />
              <span>Publish Onboarding Plan to Successor</span>
            </div>

            <p className="text-xs text-[#5C544F] leading-relaxed">
              Publishing will attach this First-7-Days plan to the approved handover snapshot. Arjun Rao
              will receive access and be able to check off completed orientation actions.
            </p>

            {hasWarnings && (
              <div className="p-3 bg-[#FEF7ED] border border-[#FCD34D] rounded-xl text-xs space-y-2 text-[#8F5105]">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle size={14} />
                  <span>Share Check Warnings Detected ({shareCheck?.warn_count})</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Some items contain redaction placeholders or cite single evidence units. Please confirm acknowledgement:
                </p>
                <label className="flex items-center gap-2 pt-1 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ackWarningsChecked}
                    onChange={(e) => setAckWarningsChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2B2521] focus:ring-[#2B2521]"
                  />
                  <span>I acknowledge the Share Check warnings</span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBE8E0]">
              <button
                type="button"
                onClick={() => setIsPublishDialogOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#d8d0c0] text-xs font-medium text-[#5C544F] hover:bg-[#F4F3EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={publishing || (hasWarnings && !ackWarningsChecked)}
                onClick={handlePublish}
                className="px-4 py-2 rounded-lg bg-[#2B2521] text-white text-xs font-medium hover:bg-[#1f1a17] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {publishing ? "Publishing..." : "Confirm & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Drawer */}
      {selectedClaim && (
        <EvidenceDrawer
          claim={selectedClaim}
          evidence={null}
          onClose={() => setSelectedClaim(null)}
        />
      )}
    </AppShell>
  );
};
