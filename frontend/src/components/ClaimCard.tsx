import React from "react";
import { ExternalLink, Check, Edit2, XCircle } from "lucide-react";
import { Claim } from "../types";
import { StatusBadge } from "./StatusBadge";
import { TypeChip } from "./TypeChip";
import { AccessChip } from "./AccessChip";
import { useHandover } from "../context/HandoverContext";

interface ClaimCardProps {
  claim: Claim;
  isSelected?: boolean;
  onSelect: (claim: Claim) => void;
  onEdit?: (claim: Claim) => void;
  className?: string;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({
  claim,
  isSelected = false,
  onSelect,
  onEdit,
  className = "",
}) => {
  const { currentUser, confirmClaim, rejectClaim } = useHandover();
  const isLead = currentUser.role === "lead";

  return (
    <article
      onClick={() => onSelect(claim)}
      className={`bg-white border rounded-xl p-5 shadow-[0_1px_2px_rgba(70,63,58,0.06)] relative transition-all cursor-pointer ${
        isSelected
          ? "border-[#d8d0c0] border-l-4 border-l-[#8d3b2a] bg-[#FAFAF8]"
          : "border-[#d8d0c0] hover:border-[#6B635E]"
      } ${className}`}
    >
      {/* Header chips */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeChip type={claim.type} />
          <span className="px-2.5 py-0.5 rounded-full bg-[#F4F3EE] border border-[#d8d0c0] text-[#241d18] text-label-caption font-label-caption font-medium">
            Owner: {claim.owner}
          </span>
          <AccessChip level={claim.access_level} />
        </div>
        <StatusBadge status={claim.status} />
      </div>

      {/* Claim Body Text */}
      <p className="text-headline-section font-headline-section text-[#241d18] leading-snug mb-3 font-semibold">
        {claim.text}
      </p>

      {/* Review State Tag if not draft */}
      {claim.review_state && claim.review_state !== "draft" && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#F4F3EE] text-[#5C544F] border border-[#d8d0c0] font-medium">
            Status: {claim.review_state}
          </span>
        </div>
      )}

      {/* Footer & Actions */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#d8d0c0]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(claim);
          }}
          className="inline-flex items-center gap-1.5 text-label-caption font-label-caption text-[#5C544F] hover:text-[#241d18] transition-colors font-medium"
        >
          <ExternalLink size={14} />
          <span>View source</span>
        </button>

        {/* Lead Action Buttons (Confirm, Edit, Reject) */}
        {isLead && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => confirmClaim(claim.id)}
              className={`px-3 py-1.5 rounded-lg text-label-caption font-label-caption flex items-center gap-1 transition-colors active:scale-[0.98] font-medium focus:outline-none focus:ring-2 focus:ring-[#2B2521] ${
                claim.review_state === "confirmed"
                  ? "bg-[#38523A] text-white"
                  : "bg-[#2B2521] text-white hover:bg-[#1f1a17]"
              }`}
              title="Confirm this claim as verified"
            >
              <Check size={13} strokeWidth={2} />
              <span>{claim.review_state === "confirmed" ? "Confirmed" : "Confirm"}</span>
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(claim)}
                className="px-3 py-1.5 rounded-lg border border-[#d8d0c0] bg-white text-[#241d18] text-label-caption font-label-caption hover:bg-[#F4F3EE] flex items-center gap-1 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[#241d18]"
                title="Edit claim details"
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => rejectClaim(claim.id)}
              className="px-2.5 py-1.5 text-label-caption font-label-caption text-[#6B635E] hover:text-[#BA1A1A] flex items-center gap-1 transition-colors font-medium"
              title="Reject this claim"
            >
              <XCircle size={13} />
              <span>Reject</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

