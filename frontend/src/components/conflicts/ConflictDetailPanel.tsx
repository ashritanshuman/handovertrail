import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  MessageSquareQuote,
  Check,
  XCircle,
  Sparkles,
} from "lucide-react";
import { api } from "../../lib/api";
import { ConflictGroup, ConflictClaimSummary, ClaimType } from "../../types";

interface ConflictDetailPanelProps {
  conflict: ConflictGroup;
  onResolved: () => void;
  onViewEvidence?: (evidenceId: string) => void;
}

export const ConflictDetailPanel: React.FC<ConflictDetailPanelProps> = ({
  conflict,
  onResolved,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal / Inline states
  const [activeModal, setActiveModal] = useState<"chose_claim" | "corrected" | "dismiss" | "unresolved" | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  // Corrected claim form states
  const [correctedText, setCorrectedText] = useState("");
  const [correctedQuote, setCorrectedQuote] = useState("");
  const [correctedType, setCorrectedType] = useState<ClaimType>("decision");

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeModal) {
        setActiveModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal]);

  const handleResolveChoseClaim = async () => {
    if (!selectedClaimId) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.resolveConflict(conflict.id, {
        resolution_type: "chose_claim",
        chosen_claim_id: selectedClaimId,
        note: note.trim() || `Lead Maya selected ${selectedClaimId} as authoritative.`,
      });
      setActiveModal(null);
      setNote("");
      onResolved();
    } catch (err: any) {
      setError(err.message || "Failed to resolve conflict.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveCorrected = async () => {
    if (!correctedText.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.resolveConflict(conflict.id, {
        resolution_type: "corrected",
        corrected_claim: {
          text: correctedText.trim(),
          quote: correctedQuote.trim(),
          type: correctedType,
          owner: "Maya Patel",
        },
        note: note.trim() || "Lead Maya authored synthesized corrected claim.",
      });
      setActiveModal(null);
      setNote("");
      setCorrectedText("");
      setCorrectedQuote("");
      onResolved();
    } catch (err: any) {
      setError(err.message || "Failed to save corrected claim.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    if (!note.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.dismissConflict(conflict.id, note.trim());
      setActiveModal(null);
      setNote("");
      onResolved();
    } catch (err: any) {
      setError(err.message || "Failed to dismiss conflict.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveUnresolved = async () => {
    if (!note.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.leaveConflictUnresolved(conflict.id, note.trim());
      setActiveModal(null);
      setNote("");
      onResolved();
    } catch (err: any) {
      setError(err.message || "Failed to mark conflict unresolved.");
    } finally {
      setSubmitting(false);
    }
  };

  const isResolvedOrDismissed = conflict.status === "resolved" || conflict.status === "dismissed";

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Panel Header */}
      <div className="p-5 border-b border-[#E5E0D8] bg-[#FAFAF8]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8D3B2A] bg-[#8D3B2A]/10 px-2.5 py-0.5 rounded-full">
              {conflict.topic || "Conflict Review"}
            </span>
            <span className="text-xs font-mono bg-white border border-[#E5E0D8] px-2 py-0.5 rounded text-[#665E55]">
              attr: {conflict.attribute}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full capitalize">
              {conflict.type}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize border bg-amber-50 text-amber-800 border-amber-200">
              {conflict.status}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-serif font-bold text-[#241D18]">
          {conflict.entity}
        </h3>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        {/* Suggestion Banner */}
        {conflict.suggestion && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Engine Recommendation / Supersession Hint
              </p>
              <p className="text-xs text-amber-950 mt-1 leading-relaxed">
                {conflict.suggestion}
              </p>
            </div>
          </div>
        )}

        {/* Leaver Exit-Interview Answer (if Riya answered) */}
        {conflict.leaver_answer && conflict.leaver_answer.answer && (
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-emerald-900 mb-1.5 pb-1 border-b border-emerald-200/60">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                Leaver Exit-Interview Clarification (Riya Sharma)
              </span>
              <span className="text-[11px] text-emerald-800/80">
                {conflict.leaver_answer.answered_at ? new Date(conflict.leaver_answer.answered_at).toLocaleDateString() : "Recorded"}
              </span>
            </div>
            <p className="text-xs text-[#241D18] italic font-serif leading-relaxed mt-2">
              &ldquo;{conflict.leaver_answer.answer}&rdquo;
            </p>
          </div>
        )}

        {/* Resolution Record Banner if already resolved/dismissed */}
        {isResolvedOrDismissed && (
          <div className="bg-[#FAFAF8] border border-[#E5E0D8] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase text-[#1E6B42] flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Conflict {conflict.status}
              </span>
              <span className="text-xs text-[#665E55]">
                • via {conflict.resolution_type} by {conflict.resolved_by || "Lead"}
              </span>
            </div>
            {conflict.note && (
              <p className="text-xs text-[#241D18] mt-1 bg-white p-2.5 rounded-lg border border-[#E5E0D8]">
                <strong className="text-[#665E55]">Lead Note:</strong> {conflict.note}
              </p>
            )}
            {conflict.resolved_claim_id && (
              <p className="text-[11px] text-[#665E55] mt-2">
                Authoritative Claim ID: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E5E0D8]">{conflict.resolved_claim_id}</code>
              </p>
            )}
          </div>
        )}

        {/* Side-by-Side Claim Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#665E55] flex items-center gap-1.5">
              <MessageSquareQuote className="h-4 w-4 text-[#8D3B2A]" />
              Conflicting Claims ({conflict.claims.length})
            </h4>
            <span className="text-[11px] text-[#665E55]">Review source quotes to resolve</span>
          </div>

          <div className={`grid gap-4 ${conflict.claims.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
            {conflict.claims.map((claim: ConflictClaimSummary, idx: number) => {
              const isAuthoritative = conflict.resolved_claim_id === claim.id;

              return (
                <div
                  key={claim.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                    isAuthoritative
                      ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400"
                      : "bg-[#FAFAF8] border-[#E5E0D8]"
                  }`}
                >
                  <div>
                    {/* Header: Claim ID, Source Badge, Review State */}
                    <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b border-[#E5E0D8]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#241D18]">
                          Option {String.fromCharCode(65 + idx)} ({claim.id})
                        </span>
                        {isAuthoritative && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            CHOSEN
                          </span>
                        )}
                      </div>
                      <span className="bg-white border border-[#E5E0D8] px-2 py-0.5 rounded text-[11px] font-mono text-[#665E55]">
                        {claim.source_ref || "source"}
                      </span>
                    </div>

                    {/* Claim Text */}
                    <p className="text-xs font-medium text-[#241D18] mb-3 leading-relaxed">
                      {claim.text}
                    </p>

                    {/* Cited Quote Box */}
                    {claim.quote && (
                      <div className="bg-white border border-[#E5E0D8] rounded-lg p-3 mb-3">
                        <span className="text-[10px] font-bold uppercase text-[#8C827A] block mb-1">
                          Cited Verbatim Quote:
                        </span>
                        <blockquote className="text-xs italic text-[#241D18] font-serif leading-relaxed">
                          &ldquo;{claim.quote}&rdquo;
                        </blockquote>
                      </div>
                    )}
                  </div>

                  {/* Metadata & Option Action */}
                  <div className="pt-2 border-t border-[#E5E0D8] mt-2">
                    <div className="flex items-center justify-between text-[11px] text-[#665E55] mb-3">
                      <span>Author: {claim.author || "Team"}</span>
                      <span>Level {claim.access_level}</span>
                    </div>

                    {!isResolvedOrDismissed && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClaimId(claim.id);
                          setActiveModal("chose_claim");
                          setNote(`Lead Maya confirmed Option ${String.fromCharCode(65 + idx)} (${claim.id}) as authoritative.`);
                        }}
                        className="w-full py-1.5 px-3 text-xs font-bold text-[#241D18] bg-white border border-[#E5E0D8] hover:bg-[#8D3B2A] hover:text-white hover:border-[#8D3B2A] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Choose Option {String.fromCharCode(65 + idx)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Resolution Actions Bar */}
        {!isResolvedOrDismissed && (
          <div className="pt-4 border-t border-[#E5E0D8]">
            <p className="text-xs font-bold text-[#665E55] uppercase tracking-wider mb-3">
              Lead Resolution Controls (Maya)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal("corrected");
                  setCorrectedText(conflict.claims[0]?.text || "");
                  setCorrectedQuote(conflict.claims[0]?.quote || "");
                  setNote("Reconciled both statements into single validated policy.");
                }}
                className="px-3.5 py-2 text-xs font-bold text-white bg-[#8D3B2A] hover:bg-[#722F22] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Write Corrected Claim
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModal("dismiss");
                  setNote("Verified as non-critical discrepancy during lead sync.");
                }}
                className="px-3.5 py-2 text-xs font-medium text-[#241D18] bg-white border border-[#E5E0D8] hover:bg-[#FAFAF8] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5 text-gray-500" />
                Dismiss as False Positive
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModal("unresolved");
                  setNote("Flagged for successor follow-up with infrastructure vendor.");
                }}
                className="px-3.5 py-2 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5 ml-auto"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                Leave Unresolved
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS / CONFIRMATION DIALOGS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E5E0D8] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5E0D8] bg-[#FAFAF8] flex items-center justify-between">
              <h4 className="text-base font-serif font-bold text-[#241D18]">
                {activeModal === "chose_claim" && "Confirm Chosen Claim"}
                {activeModal === "corrected" && "Author Corrected Claim"}
                {activeModal === "dismiss" && "Dismiss Conflict"}
                {activeModal === "unresolved" && "Mark Conflict Unresolved"}
              </h4>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-[#665E55] hover:text-[#241D18] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {activeModal === "chose_claim" && (
                <div className="space-y-3">
                  <p className="text-xs text-[#665E55]">
                    You are designating claim <strong>{selectedClaimId}</strong> as authoritative. Other conflicting claims in this topic will be rejected.
                  </p>
                  <div>
                    <label className="text-xs font-bold text-[#665E55] uppercase tracking-wider block mb-1">
                      Lead Rationale / Audit Note (Required)
                    </label>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Explain why this option is authoritative (e.g. verified in sprint retro)..."
                      className="w-full text-xs p-2.5 border border-[#E5E0D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8D3B2A]"
                    />
                  </div>
                </div>
              )}

              {activeModal === "corrected" && (
                <div className="space-y-3">
                  <p className="text-xs text-[#665E55]">
                    Synthesize a unified, authoritative statement to replace conflicting claims.
                  </p>
                  <div>
                    <label className="text-xs font-bold text-[#665E55] uppercase tracking-wider block mb-1">
                      Corrected Claim Statement
                    </label>
                    <textarea
                      rows={2}
                      value={correctedText}
                      onChange={(e) => setCorrectedText(e.target.value)}
                      placeholder="Enter the reconciled, authoritative claim text..."
                      className="w-full text-xs p-2.5 border border-[#E5E0D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8D3B2A]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#665E55] uppercase tracking-wider block mb-1">
                      Claim Type
                    </label>
                    <select
                      value={correctedType}
                      onChange={(e) => setCorrectedType(e.target.value as ClaimType)}
                      className="w-full text-xs p-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8D3B2A] bg-white text-[#241D18]"
                    >
                      <option value="decision">Decision</option>
                      <option value="task">Task</option>
                      <option value="risk">Risk</option>
                      <option value="dependency">Dependency</option>
                      <option value="open_question">Open Question</option>
                      <option value="contact">Contact</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#665E55] uppercase tracking-wider block mb-1">
                      Supporting Quote / Citation
                    </label>
                    <input
                      type="text"
                      value={correctedQuote}
                      onChange={(e) => setCorrectedQuote(e.target.value)}
                      placeholder="Quote from documentation or exit interview..."
                      className="w-full text-xs p-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8D3B2A]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#665E55] uppercase tracking-wider block mb-1">
                      Audit Note
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Rationale for this correction..."
                      className="w-full text-xs p-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8D3B2A]"
                    />
                  </div>
                </div>
              )}

              {activeModal === "dismiss" && (
                <div className="space-y-3">
                  <p className="text-xs text-[#665E55]">
                    Dismissing this conflict indicates it is a false positive or minor ambiguity. A reason is required for the audit trail.
                  </p>
                  <div>
                    <label className="text-xs font-bold text-[#665E55] uppercase tracking-wider block mb-1">
                      Dismissal Reason (Required)
                    </label>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Explain why this discrepancy does not require resolution..."
                      className="w-full text-xs p-2.5 border border-[#E5E0D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8D3B2A]"
                    />
                  </div>
                </div>
              )}

              {activeModal === "unresolved" && (
                <div className="space-y-3">
                  <p className="text-xs text-rose-800">
                    Leaving a conflict unresolved will block handover approval unless the lead explicitly acknowledges open items during approval.
                  </p>
                  <div>
                    <label className="text-xs font-bold text-[#665E55] uppercase tracking-wider block mb-1">
                      Reason for Leaving Unresolved (Required)
                    </label>
                    <textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Specify what remains unknown and what Arjun should do..."
                      className="w-full text-xs p-2.5 border border-[#E5E0D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8D3B2A]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E5E0D8] bg-[#FAFAF8] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#665E55] hover:bg-[#E5E0D8] rounded-lg transition-colors"
              >
                Cancel
              </button>

              {activeModal === "chose_claim" && (
                <button
                  type="button"
                  disabled={submitting || !note.trim()}
                  onClick={handleResolveChoseClaim}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#8D3B2A] hover:bg-[#722F22] rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Resolving..." : "Confirm & Resolve"}
                </button>
              )}

              {activeModal === "corrected" && (
                <button
                  type="button"
                  disabled={submitting || !correctedText.trim()}
                  onClick={handleResolveCorrected}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#8D3B2A] hover:bg-[#722F22] rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Corrected Claim"}
                </button>
              )}

              {activeModal === "dismiss" && (
                <button
                  type="button"
                  disabled={submitting || !note.trim()}
                  onClick={handleDismiss}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#241D18] hover:bg-black rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Dismissing..." : "Confirm Dismissal"}
                </button>
              )}

              {activeModal === "unresolved" && (
                <button
                  type="button"
                  disabled={submitting || !note.trim()}
                  onClick={handleLeaveUnresolved}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Marking..." : "Mark Unresolved"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
