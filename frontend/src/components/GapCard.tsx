import React, { useState } from "react";
import {
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  FileText,
  Calendar,
  Send,
} from "lucide-react";
import { Question } from "../types";
import { useHandover } from "../context/HandoverContext";

interface GapCardProps {
  gap: Question;
  className?: string;
}

export const GapCard: React.FC<GapCardProps> = ({ gap, className = "" }) => {
  const { answerGap, currentUser } = useHandover();
  const [answerText, setAnswerText] = useState(gap.answer || "");
  const [submitting, setSubmitting] = useState(false);

  const isAnswered = gap.state === "answered" || Boolean(gap.answer);
  const isConflict =
    gap.text.toLowerCase().includes("conflict") ||
    gap.text.toLowerCase().includes("mismatch") ||
    gap.text.toLowerCase().includes("issue #42") ||
    gap.text.toLowerCase().includes("rotat");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    setSubmitting(true);
    try {
      await answerGap(gap.id, answerText);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article
      className={`bg-white border border-[#d8d0c0] rounded-2xl p-6 sm:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)] transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#d8d0c0]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            {isAnswered ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#5F7A61]/12 text-[#38523A] border border-[#5F7A61]/35 font-medium">
                <CheckCircle2 size={13} strokeWidth={2} className="text-[#38523A]" />
                <span>Answered</span>
              </span>
            ) : isConflict ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#C9822B]/12 text-[#8F5105] border border-[#C9822B]/35 font-medium">
                <AlertTriangle size={13} className="text-[#8F5105]" />
                <span>Conflicting</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#6B635E]/12 text-[#6B635E] border border-[#d8d0c0] font-medium">
                <HelpCircle size={13} className="text-[#6B635E]" />
                <span>Missing evidence</span>
              </span>
            )}
            <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] font-medium">
              {gap.id.toUpperCase()} · ASKED BY {gap.asked_by.toUpperCase()}
            </span>
          </div>
          <h2 className="text-headline-section font-headline-section text-[#241d18] tracking-tight font-semibold">
            {gap.text}
          </h2>
        </div>
        <div className="text-right text-label-mono-metadata font-label-mono-metadata text-[#6B635E] font-medium shrink-0">
          <span>{gap.created_at ? gap.created_at.split("T")[0] : "10 Oct"}</span>
        </div>
      </div>

      {/* Two-Column Side-by-Side Comparison if Conflict */}
      {isConflict ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {/* Box A */}
          <div className="bg-[#FAFAF8] border border-[#d8d0c0] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#d8d0c0] pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#6B635E]" />
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#241d18] font-medium">
                    Issue #42 (GitHub)
                  </span>
                  <span className="text-[#6B635E]">·</span>
                  <span className="text-label-caption font-label-caption text-[#5C544F]">
                    Auth spec
                  </span>
                </div>
                <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E]">
                  28 Sep
                </span>
              </div>
              <div className="bg-white border border-[#d8d0c0] rounded-lg p-3.5 mb-3">
                <p className="text-body-default font-body-default text-[#241d18] italic">
                  “API keys must rotate every 30 days via automated Lambda hook as documented in security RFC #04.”
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-label-mono-metadata font-label-mono-metadata text-[#6B635E] pt-2">
              <span>Author: Maya Patel</span>
              <span className="text-[#241d18] font-medium">Status: Requirement</span>
            </div>
          </div>

          {/* Box B */}
          <div className="bg-[#FAFAF8] border border-[#d8d0c0] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#d8d0c0] pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#6B635E]" />
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#241d18] font-medium">
                    Meeting notes, 12 Oct
                  </span>
                  <span className="text-[#6B635E]">·</span>
                  <span className="text-label-caption font-label-caption text-[#5C544F]">
                    Sprint review
                  </span>
                </div>
                <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E]">
                  12 Oct
                </span>
              </div>
              <div className="bg-white border border-[#d8d0c0] rounded-lg p-3.5 mb-3">
                <p className="text-body-default font-body-default text-[#241d18] italic">
                  “Vault TTL configured to 2160h (90 days / quarterly) because 30-day rotation causes student union CAS auth token invalidation timeouts.”
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-label-mono-metadata font-label-mono-metadata text-[#6B635E] pt-2">
              <span>Author: Riya Sharma</span>
              <span className="text-[#8F5105] font-semibold">Note: Not backported</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Discrepancy Callout Inset in Powder Blush */}
      <div className="bg-[#E0AFA0]/15 border-l-[3px] border-[#8d3b2a] rounded-r-lg p-4 my-5">
        <p className="text-body-default font-body-default text-[#241d18] leading-relaxed">
          <strong className="font-semibold text-[#8d3b2a] mr-1.5">Discrepancy context:</strong>
          {isConflict
            ? "Production Vault TTL is set to 90 days, while Issue #42 compliance standard specifies 30 days. Clarification from Riya is required before Arjun accepts credential ownership."
            : "Missing corroborating evidence in repository archives. Please provide operational context or access transfer coordinates."}
        </p>
      </div>

      {/* Answer Area */}
      {isAnswered ? (
        <div className="border-t border-[#d8d0c0] pt-4 mt-4">
          <div className="flex items-center gap-2 mb-2 text-label-mono-metadata font-label-mono-metadata text-[#38523A]">
            <CheckCircle2 size={14} />
            <span className="uppercase tracking-wider font-semibold">
              Recorded Answer ({gap.answered_by || "Riya Sharma"})
            </span>
            <span className="text-[#6B635E]">·</span>
            <span className="text-[#6B635E]">
              {gap.answered_at ? gap.answered_at.split("T")[0] : "Verified"}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-[#F4F3EE] border border-[#d8d0c0] text-body-default text-[#241d18]">
            {gap.answer}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border-t border-[#d8d0c0] pt-4 mt-4">
          <label
            htmlFor={`ans-${gap.id}`}
            className="block text-headline-section font-headline-section text-[#241d18] mb-1 font-semibold"
          >
            Leaver clarification <span className="text-label-caption text-[#5C544F] font-normal">(For Arjun Rao)</span>
          </label>
          <p className="text-label-caption text-[#5C544F] mb-3">
            Provide contextual rationale, configuration paths, or instructions to reconcile the discrepancy.
          </p>
          <textarea
            id={`ans-${gap.id}`}
            rows={3}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Explain the intended rotation schedule or steps to align Vault config with RFC..."
            className="w-full rounded-[10px] border border-[#d8d0c0] bg-white p-3 text-body-default font-body-default text-[#241d18] placeholder-[#6B635E] focus:border-[#241d18] focus:outline-none transition-colors mb-3"
          />
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={submitting || !answerText.trim()}
              className={`px-4 py-2 rounded-[10px] text-body-medium font-body-medium flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2 ${
                answerText.trim()
                  ? "bg-[#2B2521] hover:bg-[#1f1a17] text-white"
                  : "bg-[#6B635E] text-[#F4F3EE] cursor-not-allowed"
              }`}
            >
              <Send size={14} />
              <span>{submitting ? "Submitting..." : "Submit answer"}</span>
            </button>
            <span className="text-label-mono-metadata text-[#6B635E]">
              Active user: {currentUser.name}
            </span>
          </div>
        </form>
      )}
    </article>
  );
};
