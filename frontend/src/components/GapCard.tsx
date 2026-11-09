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
      className={`bg-white border border-[#E7E4DE] rounded-2xl p-6 sm:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)] transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#E7E4DE]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            {isAnswered ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#5F7A61]/12 text-[#5F7A61] border border-[#5F7A61]/30">
                <CheckCircle2 size={13} strokeWidth={2} />
                <span>Answered</span>
              </span>
            ) : isConflict ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#C9822B]/12 text-[#C9822B] border border-[#C9822B]/30">
                <AlertTriangle size={13} />
                <span>Conflicting</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#8A817C]/12 text-[#8A817C] border border-[#8A817C]/30">
                <HelpCircle size={13} />
                <span>Missing evidence</span>
              </span>
            )}
            <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
              {gap.id.toUpperCase()} · ASKED BY {gap.asked_by.toUpperCase()}
            </span>
          </div>
          <h2 className="text-headline-section font-headline-section text-[#463F3A] tracking-tight font-medium">
            {gap.text}
          </h2>
        </div>
        <div className="text-right text-label-mono-metadata font-label-mono-metadata text-[#8A817C] shrink-0">
          <span>{gap.created_at ? gap.created_at.split("T")[0] : "10 Oct"}</span>
        </div>
      </div>

      {/* Two-Column Side-by-Side Comparison if Conflict */}
      {isConflict ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {/* Box A */}
          <div className="bg-[#FAFAF8] border border-[#E7E4DE] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E7E4DE] pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#8A817C]" />
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#463F3A]">
                    Issue #42 (GitHub)
                  </span>
                  <span className="text-[#BCB8B1]">·</span>
                  <span className="text-label-caption font-label-caption text-[#8A817C]">
                    Auth spec
                  </span>
                </div>
                <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                  28 Sep
                </span>
              </div>
              <div className="bg-white border border-[#E7E4DE] rounded-lg p-3.5 mb-3">
                <p className="text-body-default font-body-default text-[#463F3A] italic">
                  “API keys must rotate every 30 days via automated Lambda hook as documented in security RFC #04.”
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-label-mono-metadata font-label-mono-metadata text-[#8A817C] pt-2">
              <span>Author: Maya Patel</span>
              <span className="text-[#463F3A] font-medium">Status: Requirement</span>
            </div>
          </div>

          {/* Box B */}
          <div className="bg-[#FAFAF8] border border-[#E7E4DE] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E7E4DE] pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#8A817C]" />
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#463F3A]">
                    Meeting notes, 12 Oct
                  </span>
                  <span className="text-[#BCB8B1]">·</span>
                  <span className="text-label-caption font-label-caption text-[#8A817C]">
                    Sprint review
                  </span>
                </div>
                <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                  12 Oct
                </span>
              </div>
              <div className="bg-white border border-[#E7E4DE] rounded-lg p-3.5 mb-3">
                <p className="text-body-default font-body-default text-[#463F3A] italic">
                  “Vault TTL configured to 2160h (90 days / quarterly) because 30-day rotation causes student union CAS auth token invalidation timeouts.”
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-label-mono-metadata font-label-mono-metadata text-[#8A817C] pt-2">
              <span>Author: Riya Sharma</span>
              <span className="text-[#C9822B] font-medium">Note: Not backported</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Discrepancy Callout Inset in Powder Blush */}
      <div className="bg-[#E0AFA0]/12 border-l-[3px] border-[#E0AFA0] rounded-r-lg p-4 my-5">
        <p className="text-body-default font-body-default text-[#463F3A] leading-relaxed">
          <strong className="font-semibold text-[#463F3A] mr-1.5">Discrepancy context:</strong>
          {isConflict
            ? "Production Vault TTL is set to 90 days, while Issue #42 compliance standard specifies 30 days. Clarification from Riya is required before Arjun accepts credential ownership."
            : "Missing corroborating evidence in repository archives. Please provide operational context or access transfer coordinates."}
        </p>
      </div>

      {/* Answer Area */}
      {isAnswered ? (
        <div className="border-t border-[#E7E4DE] pt-4 mt-4">
          <div className="flex items-center gap-2 mb-2 text-label-mono-metadata font-label-mono-metadata text-[#5F7A61]">
            <CheckCircle2 size={14} />
            <span className="uppercase tracking-wider font-semibold">
              Recorded Answer ({gap.answered_by || "Riya Sharma"})
            </span>
            <span className="text-[#8A817C]">·</span>
            <span className="text-[#8A817C]">
              {gap.answered_at ? gap.answered_at.split("T")[0] : "Verified"}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-[#F4F3EE] border border-[#E7E4DE] text-body-default text-[#463F3A]">
            {gap.answer}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border-t border-[#E7E4DE] pt-4 mt-4">
          <label
            htmlFor={`ans-${gap.id}`}
            className="block text-headline-section font-headline-section text-[#463F3A] mb-1 font-medium"
          >
            Leaver clarification <span className="text-label-caption text-[#8A817C] font-normal">(For Arjun Rao)</span>
          </label>
          <p className="text-label-caption text-[#8A817C] mb-3">
            Provide contextual rationale, configuration paths, or instructions to reconcile the discrepancy.
          </p>
          <textarea
            id={`ans-${gap.id}`}
            rows={3}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Explain the intended rotation schedule or steps to align Vault config with RFC..."
            className="w-full rounded-[10px] border border-[#BCB8B1] bg-white p-3 text-body-default font-body-default text-[#463F3A] placeholder-[#8A817C] focus:border-[#463F3A] focus:outline-none transition-colors mb-3"
          />
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={submitting || !answerText.trim()}
              className={`px-4 py-2 rounded-[10px] text-body-medium font-body-medium flex items-center gap-2 transition-colors ${
                answerText.trim()
                  ? "bg-[#463F3A] hover:bg-[#37312D] text-white"
                  : "bg-[#BCB8B1] text-white cursor-not-allowed opacity-60"
              }`}
            >
              <Send size={14} />
              <span>{submitting ? "Submitting..." : "Submit answer"}</span>
            </button>
            <span className="text-label-mono-metadata text-[#8A817C]">
              Active user: {currentUser.name}
            </span>
          </div>
        </form>
      )}
    </article>
  );
};
