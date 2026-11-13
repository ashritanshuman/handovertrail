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
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#d8d0c0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] tracking-wider uppercase font-semibold">
              Project dossier
            </span>
            <span className="text-[#6B635E] text-label-mono-metadata">•</span>
            <span className="text-label-mono-metadata font-label-mono-metadata text-[#5C544F]">
              Lead: Maya Patel
            </span>
            <span className="text-[#6B635E] text-label-mono-metadata">•</span>
            <span className="text-label-mono-metadata font-label-mono-metadata text-[#5C544F]">
              Leaver: Riya Sharma
            </span>
          </div>
          <h1 className="text-headline-page font-headline-page text-[#241d18] font-semibold">
            CampusConnect handover
          </h1>
          <p className="text-body-default font-body-default text-[#5C544F] mt-1">
            Riya Sharma transitioning to Arjun Rao · Clearance Level 1-2 Workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAnalysisModalOpen(true)}
            className="inline-flex items-center gap-2 px-[18px] py-[10px] rounded-[10px] bg-[#2B2521] hover:bg-[#1f1a17] text-white text-body-medium font-body-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2"
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
        <article className="md:col-span-6 lg:col-span-5 bg-[#FDF5F2] border border-[#d8d0c0] rounded-2xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#d8d0c0]">
              <div className="flex items-center gap-2">
                <h2 className="text-headline-section font-headline-section text-[#241d18] font-semibold">
                  Open gaps &amp; conflicts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-label-caption font-label-caption bg-[#C9822B]/15 text-[#8F5105] border border-[#C9822B]/35 font-semibold">
                  {typeof stats?.conflicts_open === "number" && stats.conflicts_open > 0
                    ? `${stats.conflicts_open} conflicts · ${openGapsCount} gaps`
                    : `${openGapsCount} unresolved`}
                </span>
              </div>
              <AlertTriangle size={18} className="text-[#8F5105]" />
            </div>

            <div className="space-y-3 pt-4">
              {/* Gap Item 1 */}
              <div className="p-3 bg-white border border-[#d8d0c0] rounded-[10px] space-y-1.5">
                <p className="text-body-default font-body-default text-[#241d18] leading-relaxed text-sm">
                  "Issue #42 says the API key rotates monthly; the 12 Oct notes say quarterly. Which is correct?"
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#C9822B]/15 text-[#8F5105] border border-[#C9822B]/35">
                    Conflicting credential policy
                  </span>
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#5C544F]">
                    Auth module
                  </span>
                </div>
              </div>

              {/* Gap Item 2 */}
              <div className="p-3 bg-white border border-[#d8d0c0] rounded-[10px] space-y-1.5">
                <p className="text-body-default font-body-default text-[#241d18] leading-relaxed text-sm">
                  "Push notification production APNS certificate is registered under personal Apple Developer account."
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#6B635E]/15 text-[#6B635E] border border-[#d8d0c0]">
                    Missing team access
                  </span>
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#5C544F]">
                    DevOps
                  </span>
                </div>
              </div>

              {/* Gap Item 3 */}
              <div className="p-3 bg-white border border-[#d8d0c0] rounded-[10px] space-y-1.5">
                <p className="text-body-default font-body-default text-[#241d18] leading-relaxed text-sm">
                  "Event discovery feed cache eviction interval defaults to 5 minutes, but pilot load testing document references 60s."
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#6B7F94]/15 text-[#3C5066] border border-[#6B7F94]/35">
                    Architectural mismatch
                  </span>
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#5C544F]">
                    Backend
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2">
            <Link
              to="/gaps"
              className="inline-flex items-center gap-1.5 text-body-medium font-body-medium text-[#241d18] hover:underline font-semibold"
            >
              <span>Review all gaps</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </article>

        {/* Bento 5: Next Step (3 cols desktop) */}
        <article className="md:col-span-12 lg:col-span-3 bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#d8d0c0]">
              <h2 className="text-headline-section font-headline-section text-[#241d18] font-semibold">Next step</h2>
              <CheckCircle2 size={18} className="text-[#38523A]" />
            </div>

            <div className="pt-4 space-y-4">
              <div>
                <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] uppercase tracking-wider font-semibold">
                  Pending sign-off
                </span>
                <p className="text-headline-section font-headline-section text-[#241d18] mt-1 leading-snug font-semibold">
                  {totalClaims - reviewedCount > 0
                    ? `${totalClaims - reviewedCount} claims need your review`
                    : "All claims reviewed"}
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-1.5 bg-[#F4F3EE] p-3 rounded-[10px] border border-[#d8d0c0]">
                <div className="flex justify-between items-center text-label-caption font-label-caption">
                  <span className="text-[#241d18] font-semibold">Review state</span>
                  <span className="text-[#5C544F] font-mono">
                    {reviewedCount} of {totalClaims} reviewed
                  </span>
                </div>
                <div className="w-full bg-[#d8d0c0] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#38523A] h-full rounded-full transition-all duration-300"
                    style={{ width: `${reviewPct}%` }}
                  ></div>
                </div>
                <div className="flex justify-end">
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#38523A] font-bold">
                    {reviewPct}% complete
                  </span>
                </div>
              </div>

              <p className="text-body-default font-body-default text-[#5C544F] text-sm">
                Review remaining claims to generate final handover certification for Arjun.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/review"
              className="w-full inline-flex justify-center items-center gap-2 px-[18px] py-[10px] rounded-[10px] bg-[#2B2521] hover:bg-[#1f1a17] text-white text-body-medium font-body-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2"
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
