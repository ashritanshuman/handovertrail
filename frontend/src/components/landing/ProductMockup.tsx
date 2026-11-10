import React, { useState } from "react";
import { Lock } from "lucide-react";
import { ClaimCard } from "../ClaimCard";
import { EvidenceDrawer } from "../EvidenceDrawer";
import { Claim, EvidenceUnit } from "../../types";

const SAMPLE_EVIDENCE: EvidenceUnit = {
  id: "ev-slack-campus-ops",
  project_id: "campusconnect",
  source_type: "slack",
  source_ref: "slack:#campus-ops",
  location: "Thread 14:22 UTC",
  author: "Riya Sharma (Outgoing Lead Eng)",
  timestamp: "2024-08-18T14:22:00Z",
  text: "Spun up dedicated redis-worker-3 today. If we leave orientation check-in on default CAS redis we will crash again next Monday morning. Commit c4a91f merged by Maya Patel.",
  access_level: 1,
};

const SAMPLE_CLAIM: Claim = {
  id: "claim-pr-142",
  project_id: "campusconnect",
  type: "decision",
  text: "Moved event registration queue to isolated Redis worker to isolate orientation ticket surges",
  owner: "Riya Sharma",
  status: "verified",
  evidence_ids: ["ev-slack-campus-ops"],
  quote: "Spun up dedicated redis-worker-3 today. If we leave orientation check-in on default CAS redis we will crash again next Monday morning.",
  access_level: 1,
  review_state: "confirmed",
  version: 3,
  origin: "cache",
  supporting_evidence: [SAMPLE_EVIDENCE],
};

export const ProductMockup: React.FC = () => {
  const [activeClaim, setActiveClaim] = useState<Claim>(SAMPLE_CLAIM);

  return (
    <div className="mt-14 max-w-[1080px] mx-auto text-left relative animate-fade-in">
      {/* Floating Proof Chip 1: Top Left */}
      <div className="absolute -top-4 -left-3 sm:-left-6 z-20 bg-white border border-[#d8d0c0] rounded-full px-3.5 py-1.5 shadow-[0_8px_20px_-4px_rgba(70,63,58,0.12)] flex items-center gap-2 text-xs font-medium text-[#241d18]">
        <span className="w-4 h-4 rounded-full bg-[#5F7A61]/15 text-[#38523A] flex items-center justify-center font-bold text-xs">
          ✓
        </span>
        <span className="font-semibold">Quote found in source</span>
      </div>

      {/* Floating Proof Chip 2: Right */}
      <div className="absolute top-16 -right-3 sm:-right-6 z-20 bg-white border border-[#d8d0c0] rounded-full px-3.5 py-1.5 shadow-[0_8px_20px_-4px_rgba(70,63,58,0.12)] flex items-center gap-2 text-xs font-medium text-[#241d18]">
        <span className="w-2 h-2 rounded-full bg-[#8F5105]"></span>
        <span className="font-mono text-xs text-[#8F5105] font-semibold">GAP-081</span>
        <span className="text-[#5C544F] text-xs font-medium">30d vs 90d TTL</span>
      </div>

      {/* Floating Proof Chip 3: Bottom Left */}
      <div className="absolute -bottom-4 left-6 sm:left-12 z-20 bg-white border border-[#d8d0c0] rounded-full px-3.5 py-1.5 shadow-[0_8px_20px_-4px_rgba(70,63,58,0.12)] flex items-center gap-2 text-xs font-medium text-[#241d18]">
        <Lock size={13} className="text-[#6B635E]" />
        <span className="font-semibold">4 items hidden by access</span>
        <span className="font-mono text-xs bg-[#F4F3EE] text-[#241d18] border border-[#d8d0c0] px-1.5 py-0.5 rounded font-medium">
          Role: Arjun Rao
        </span>
      </div>

      {/* Frame Container */}
      <div className="rounded-2xl border border-[#d8d0c0] bg-white shadow-[0_24px_60px_-15px_rgba(70,63,58,0.12)] overflow-hidden">
        {/* Top Chrome */}
        <div className="h-10 bg-[#FAF9F5] border-b border-[#d8d0c0] px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#d8d0c0]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#d8d0c0]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#d8d0c0]"></div>
          </div>
          <div className="px-4 py-1 rounded-md bg-white border border-[#d8d0c0] text-xs font-mono text-[#241d18] flex items-center gap-1.5 font-medium">
            <Lock size={12} className="text-[#6B635E]" />
            <span>handovertrail.com/campusconnect/review</span>
          </div>
          <div className="w-12"></div>
        </div>

        {/* Real Components Inside Mockup: ClaimCard + EvidenceDrawer */}
        <div className="p-6 md:p-8 bg-[#FAF9F5]/40 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 cols: Real ClaimCard */}
          <div className="lg:col-span-7">
            <ClaimCard
              claim={activeClaim}
              isSelected={true}
              onSelect={(c) => setActiveClaim(c)}
              className="bg-white"
            />
          </div>

          {/* Right 5 cols: Real EvidenceDrawer with static sample props */}
          <div className="lg:col-span-5">
            <EvidenceDrawer
              claim={activeClaim}
              evidence={activeClaim.supporting_evidence?.[0] || SAMPLE_EVIDENCE}
              className="!static !top-0 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

