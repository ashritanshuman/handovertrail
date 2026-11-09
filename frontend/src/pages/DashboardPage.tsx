import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  RotateCw,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { ActivityBarChart } from "../components/ActivityBarChart";
import { ReadinessDonut } from "../components/ReadinessDonut";
import { ClaimsByTypeBars } from "../components/ClaimsByTypeBars";
import { ProgressStepsModal } from "../components/ProgressStepsModal";
import { useHandover } from "../context/HandoverContext";

export const DashboardPage: React.FC = () => {
  const { stats, claims, gaps, refreshData } = useHandover();
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);

  const totalClaims = stats?.total_claims || claims.length || 14;
  const reviewedCount = claims.filter(
    (c) => c.review_state && c.review_state !== "draft"
  ).length;
  const reviewPct = totalClaims > 0 ? Math.round((reviewedCount / totalClaims) * 100) : 0;

  const openGapsCount = gaps.filter((g) => g.state === "open" && !g.answer).length || 3;

  return (
    <AppShell>
      {/* Editorial Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E7E4DE]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C] tracking-wider uppercase">
              Project dossier
            </span>
            <span className="text-[#BCB8B1] text-label-mono-metadata">•</span>
            <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
              Lead: Maya Patel
            </span>
            <span className="text-[#BCB8B1] text-label-mono-metadata">•</span>
            <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
              Leaver: Riya Sharma
            </span>
          </div>
          <h1 className="text-headline-page font-headline-page text-[#463F3A]">
            CampusConnect handover
          </h1>
          <p className="text-body-default font-body-default text-[#8A817C] mt-1">
            Riya Sharma transitioning to Arjun Rao · Clearance Level 1-2 Workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAnalysisModalOpen(true)}
            className="inline-flex items-center gap-2 px-[18px] py-[10px] rounded-[10px] bg-[#463F3A] hover:bg-[#37312D] active:bg-[#2B2724] text-white text-body-medium font-body-medium shadow-sm transition-all"
          >
            <RotateCw size={16} />
            <span>Run analysis</span>
          </button>
        </div>
      </section>

      {/* Bento Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
        {/* Bento 1: Large Activity Chart (8 cols desktop) */}
        <div className="md:col-span-12 lg:col-span-8">
          <ActivityBarChart className="h-full" />
        </div>

        {/* Bento 2: Handover Readiness Donut (4 cols desktop) */}
        <div className="md:col-span-12 lg:col-span-4">
          <ReadinessDonut stats={stats} className="h-full" />
        </div>

        {/* Bento 3: Claims by Type (4 cols desktop) */}
        <div className="md:col-span-6 lg:col-span-4">
          <ClaimsByTypeBars stats={stats} className="h-full" />
        </div>

        {/* Bento 4: Open Gaps (Soft blush-tinted card) (5 cols desktop) */}
        <article className="md:col-span-6 lg:col-span-5 bg-[#FDF5F2] border border-[#F0D5CD] rounded-2xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0D5CD]">
              <div className="flex items-center gap-2">
                <h2 className="text-headline-section font-headline-section text-[#463F3A]">
                  Open gaps
                </h2>
                <span className="px-2 py-0.5 rounded-full text-label-caption font-label-caption bg-[#C9822B]/15 text-[#C9822B] font-semibold">
                  {openGapsCount} unresolved
                </span>
              </div>
              <AlertTriangle size={18} className="text-[#C9822B]" />
            </div>

            <div className="space-y-3 pt-4">
              {/* Gap Item 1 */}
              <div className="p-3 bg-white border border-[#F0D5CD] rounded-[10px] space-y-1.5">
                <p className="text-body-default font-body-default text-[#463F3A] leading-relaxed text-[13px]">
                  "Issue #42 says the API key rotates monthly; the 12 Oct notes say quarterly. Which is correct?"
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#C9822B]/12 text-[#C9822B]">
                    Conflicting credential policy
                  </span>
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                    Auth module
                  </span>
                </div>
              </div>

              {/* Gap Item 2 */}
              <div className="p-3 bg-white border border-[#F0D5CD] rounded-[10px] space-y-1.5">
                <p className="text-body-default font-body-default text-[#463F3A] leading-relaxed text-[13px]">
                  "Push notification production APNS certificate is registered under personal Apple Developer account."
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#8A817C]/15 text-[#8A817C]">
                    Missing team access
                  </span>
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                    DevOps
                  </span>
                </div>
              </div>

              {/* Gap Item 3 */}
              <div className="p-3 bg-white border border-[#F0D5CD] rounded-[10px] space-y-1.5">
                <p className="text-body-default font-body-default text-[#463F3A] leading-relaxed text-[13px]">
                  "Event discovery feed cache eviction interval defaults to 5 minutes, but pilot load testing document references 60s."
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#6B7F94]/15 text-[#6B7F94]">
                    Architectural mismatch
                  </span>
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                    Backend
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2">
            <Link
              to="/gaps"
              className="inline-flex items-center gap-1.5 text-body-medium font-body-medium text-[#463F3A] hover:underline"
            >
              <span>Review all gaps</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </article>

        {/* Bento 5: Next Step (3 cols desktop) */}
        <article className="md:col-span-12 lg:col-span-3 bg-white border border-[#E7E4DE] rounded-2xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DE]">
              <h2 className="text-headline-section font-headline-section text-[#463F3A]">Next step</h2>
              <CheckCircle2 size={18} className="text-[#8A817C]" />
            </div>

            <div className="pt-4 space-y-4">
              <div>
                <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C] uppercase tracking-wider">
                  Pending sign-off
                </span>
                <p className="text-headline-section font-headline-section text-[#463F3A] mt-1 leading-snug font-medium">
                  {totalClaims - reviewedCount > 0
                    ? `${totalClaims - reviewedCount} claims need your review`
                    : "All claims reviewed"}
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-1.5 bg-[#F4F3EE] p-3 rounded-[10px] border border-[#E7E4DE]">
                <div className="flex justify-between items-center text-label-caption font-label-caption">
                  <span className="text-[#463F3A] font-medium">Review state</span>
                  <span className="text-[#8A817C] font-mono">
                    {reviewedCount} of {totalClaims} reviewed
                  </span>
                </div>
                <div className="w-full bg-[#BCB8B1]/40 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#5F7A61] h-full rounded-full transition-all duration-300"
                    style={{ width: `${reviewPct}%` }}
                  ></div>
                </div>
                <div className="flex justify-end">
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#5F7A61] font-semibold">
                    {reviewPct}% complete
                  </span>
                </div>
              </div>

              <p className="text-body-default font-body-default text-[#8A817C] text-[13px]">
                Review remaining claims to generate final handover certification for Arjun.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/review"
              className="w-full inline-flex justify-center items-center gap-2 px-[18px] py-[10px] rounded-[10px] bg-[#463F3A] hover:bg-[#37312D] text-white text-body-medium font-body-medium shadow-sm transition-all"
            >
              <span>Go to review</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      </div>

      {/* Step Progress Extraction Modal */}
      <ProgressStepsModal
        isOpen={analysisModalOpen}
        onClose={() => setAnalysisModalOpen(false)}
        onComplete={() => {
          refreshData();
        }}
      />
    </AppShell>
  );
};
