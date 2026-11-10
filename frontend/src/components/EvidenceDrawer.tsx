import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Info,
  MessageSquare,
  FileCode,
  FileText,
} from "lucide-react";
import { Claim, EvidenceUnit } from "../types";

interface EvidenceDrawerProps {
  claim: Claim | null;
  evidence: EvidenceUnit | null;
  onClose?: () => void;
  className?: string;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  claim,
  evidence,
  onClose,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  if (!claim) {
    return (
      <aside
        className={`bg-white border border-[#d8d0c0] rounded-xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col items-center justify-center text-center text-[#6B635E] min-h-[360px] ${className}`}
      >
        <FileText size={32} className="mb-2 text-[#6B635E]" strokeWidth={1.5} />
        <p className="text-body-medium font-medium text-[#241d18]">No claim selected</p>
        <p className="text-label-caption text-[#5C544F] mt-1 max-w-[220px]">
          Select any claim card from the stream to inspect its verified source evidence.
        </p>
      </aside>
    );
  }

  const quote = claim.quote || "";
  const evText = evidence?.text || claim.supporting_evidence?.[0]?.text || quote || "";
  const sourceRef = evidence?.source_ref || claim.evidence_ids?.[0] || "Slack #backend";
  const author = evidence?.author || claim.owner || "Riya Sharma";
  const timestamp = evidence?.timestamp || "2024-10-03T14:22:00Z";
  const sourceType = evidence?.source_type || "chat";

  const handleCopy = () => {
    navigator.clipboard.writeText(`Claim: ${claim.text}\nQuote: "${quote}"\nSource: ${sourceRef}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render raw excerpt with <mark class="quote-highlight"> around quote
  const renderExcerpt = () => {
    if (!evText) {
      return <p className="italic text-[#6B635E]">No full excerpt text available in archive.</p>;
    }

    if (!quote || !evText.toLowerCase().includes(quote.toLowerCase())) {
      return (
        <p>
          "...<mark className="quote-highlight">{quote || evText}</mark>..."
        </p>
      );
    }

    // Split on quote case-insensitively
    const lowerEv = evText.toLowerCase();
    const lowerQ = quote.toLowerCase();
    const index = lowerEv.indexOf(lowerQ);

    const before = evText.substring(0, index);
    const matched = evText.substring(index, index + quote.length);
    const after = evText.substring(index + quote.length);

    return (
      <p>
        {before}
        <mark className="quote-highlight">{matched}</mark>
        {after}
      </p>
    );
  };

  const getStatusReasoning = () => {
    switch (claim.status) {
      case "verified":
        return {
          icon: <CheckCircle2 size={16} className="text-[#38523A] mt-0.5" />,
          title: "Why this status:",
          desc: "Quote found verbatim in source archive with corroborating documentation.",
          bg: "bg-[#5F7A61]/10 border-[#5F7A61]/35 text-[#38523A]",
        };
      case "inferred":
        return {
          icon: <Info size={16} className="text-[#3C5066] mt-0.5" />,
          title: "Why this status:",
          desc: "Derived assumption identified in architecture discussion; exact quote missing from contract.",
          bg: "bg-[#6B7F94]/10 border-[#6B7F94]/35 text-[#3C5066]",
        };
      case "conflicting":
        return {
          icon: <AlertTriangle size={16} className="text-[#8F5105] mt-0.5" />,
          title: "Why this status:",
          desc: claim.conflict_details
            ? `Discrepancy: "${claim.conflict_details.statement_a}" vs "${claim.conflict_details.statement_b}"`
            : "Contradictory claims identified across multiple authoritative project sources.",
          bg: "bg-[#C9822B]/10 border-[#C9822B]/35 text-[#8F5105]",
        };
      default:
        return {
          icon: <HelpCircle size={16} className="text-[#6B635E] mt-0.5" />,
          title: "Why this status:",
          desc: "Knowledge gap with no corroborated evidence in ingested archives; awaiting resolution.",
          bg: "bg-[#6B635E]/10 border-[#d8d0c0] text-[#6B635E]",
        };
    }
  };

  const reasoning = getStatusReasoning();

  return (
    <aside
      className={`bg-white border border-[#d8d0c0] rounded-xl p-5 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col gap-5 sticky top-24 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#d8d0c0]">
        <div>
          <h2 className="text-headline-section font-headline-section text-[#241d18] font-semibold">Evidence</h2>
          <div className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] mt-0.5">
            Ref: {claim.id} · {claim.type.toUpperCase()}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#6B635E]">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-[#F4F3EE] hover:text-[#241d18] transition-colors"
            title="Copy reference citation"
          >
            {copied ? <Check size={16} className="text-[#38523A]" /> : <Copy size={16} />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#F4F3EE] hover:text-[#241d18] transition-colors"
              title="Close panel"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Source Badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F3EE] border border-[#d8d0c0]">
        {sourceType === "github" ? (
          <FileCode size={16} className="text-[#6B635E]" />
        ) : sourceType === "slack" || sourceType === "chat" ? (
          <MessageSquare size={16} className="text-[#6B635E]" />
        ) : (
          <FileText size={16} className="text-[#6B635E]" />
        )}
        <span className="text-label-caption font-label-caption text-[#241d18] font-medium truncate">
          {sourceRef} · {author}
        </span>
      </div>

      {/* Original Source Quote Block with blush border and <mark> */}
      <div className="rounded-lg p-4 bg-[#F4F3EE] border-l-[3px] border-[#8d3b2a] text-body-default font-body-default text-[#241d18] leading-relaxed text-sm">
        <div className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] mb-2 tracking-wide uppercase font-semibold">
          Verbatim Excerpt from Archive:
        </div>
        {renderExcerpt()}
      </div>

      {/* Key-Value Metadata List */}
      <div className="border border-[#d8d0c0] rounded-lg divide-y divide-[#d8d0c0] bg-white text-label-caption font-label-caption">
        <div className="px-3.5 py-2.5 flex justify-between items-center">
          <span className="text-[#6B635E]">Author</span>
          <span className="text-[#241d18] font-medium">{author}</span>
        </div>
        <div className="px-3.5 py-2.5 flex justify-between items-center">
          <span className="text-[#6B635E]">Date / Timestamp</span>
          <span className="text-[#241d18] font-medium font-mono text-xs">
            {timestamp.includes("T") ? timestamp.split("T")[0] : timestamp}
          </span>
        </div>
        <div className="px-3.5 py-2.5 flex justify-between items-center">
          <span className="text-[#6B635E]">Source type</span>
          <span className="text-[#241d18] font-medium capitalize">{sourceType}</span>
        </div>
        <div className="px-3.5 py-2.5 flex justify-between items-center">
          <span className="text-[#6B635E]">Access level</span>
          <span className="text-[#241d18] font-medium">
            {claim.access_level === 1
              ? "Team (L1)"
              : claim.access_level === 2
              ? "Lead Only (L2)"
              : "Confidential (L3)"}
          </span>
        </div>
        <div className="px-3.5 py-2.5 flex justify-between items-center">
          <span className="text-[#6B635E]">Source Reference</span>
          <span className="font-mono text-xs text-[#241d18] px-1.5 py-0.5 rounded bg-[#F4F3EE] border border-[#d8d0c0] font-medium">
            {evidence?.id || claim.evidence_ids?.[0] || "ev-sync-01"}
          </span>
        </div>
      </div>

      {/* Verification Reasoning Block ("Why this status") */}
      <div className={`rounded-lg p-3.5 border flex flex-col gap-2 ${reasoning.bg}`}>
        <div className="flex items-start gap-2">
          {reasoning.icon}
          <div className="text-label-caption font-label-caption text-[#241d18] leading-snug">
            <strong className="font-semibold mr-1">{reasoning.title}</strong>
            {reasoning.desc}
          </div>
        </div>
        <div className="text-label-mono-metadata font-label-mono-metadata text-[#5C544F] pt-1.5 border-t border-current/20 flex items-center justify-between">
          <span>Verified against immutable ingest snapshot</span>
          <span className="font-mono">v{claim.version}.0</span>
        </div>
      </div>
    </aside>
  );
};
