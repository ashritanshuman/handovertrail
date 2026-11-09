import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderArchive,
  Sparkles,
  CheckCircle2,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Lock,
  FileCheck,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useHandover } from "../context/HandoverContext";

export const StartPage: React.FC = () => {
  const navigate = useNavigate();
  const { loadDemoProject } = useHandover();
  const [loading, setLoading] = useState(false);

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      await loadDemoProject();
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      navigate("/dashboard"); // fallback navigation
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell minimal>
      <div className="max-w-7xl mx-auto w-full py-8 md:py-14 flex flex-col justify-center">
        {/* Hero Section */}
        <section className="max-w-3xl mx-auto text-center mb-14 md:mb-18">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E7E4DE] bg-white mb-6 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E0AFA0]"></span>
            <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C] uppercase tracking-wider">
              KNOWLEDGE HANDOVER PROTOCOL
            </span>
          </div>

          <h1 className="text-[#463F3A] font-headline-page text-[36px] sm:text-[46px] leading-[1.16] tracking-[-0.025em] font-semibold mb-6">
            Hand over what the documents never captured.
          </h1>

          <p className="text-[#8A817C] text-body-medium font-body-medium max-w-xl mx-auto leading-relaxed text-base">
            Every claim linked to its source. Uncertainty shown, never hidden. You approve before anyone sees it.
          </p>
        </section>

        {/* 4-Step Process Bento Grid */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E0AFA0]"></span>
              <h2 className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C] uppercase tracking-wider">
                START HERE
              </h2>
            </div>
            <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
              4-STEP VERIFICATION PROTOCOL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 01 */}
            <div className="bg-white border border-[#E7E4DE] rounded-xl p-5 shadow-[0_1px_2px_rgba(70,63,58,0.06)] hover:border-[#BCB8B1] transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#463F3A] border border-[#E7E4DE] bg-[#F4F3EE] px-2 py-0.5 rounded font-semibold">
                    01
                  </span>
                  <FolderArchive size={20} className="text-[#8A817C] group-hover:text-[#463F3A] transition-colors" />
                </div>
                <h3 className="text-headline-section font-headline-section text-[#463F3A] mb-2 font-medium">
                  Load demo project
                </h3>
                <p className="text-[#8A817C] text-body-default font-body-default text-[13px] leading-relaxed">
                  Instantly populate CampusConnect repositories, Slack exports, and meeting minutes.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-[#F4F3EE] flex items-center gap-1.5 text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                <span className="w-1 h-1 rounded-full bg-[#BCB8B1]"></span>
                <span>Synthesized dataset</span>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-white border border-[#E7E4DE] rounded-xl p-5 shadow-[0_1px_2px_rgba(70,63,58,0.06)] hover:border-[#BCB8B1] transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C] border border-[#E7E4DE] bg-[#F4F3EE] px-2 py-0.5 rounded">
                    02
                  </span>
                  <Sparkles size={20} className="text-[#8A817C] group-hover:text-[#463F3A] transition-colors" />
                </div>
                <h3 className="text-headline-section font-headline-section text-[#463F3A] mb-2 font-medium">
                  Run analysis
                </h3>
                <p className="text-[#8A817C] text-body-default font-body-default text-[13px] leading-relaxed">
                  Extract verifiable claims, technical decisions, and uncover contradictory evidence.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-[#F4F3EE] flex items-center gap-1.5 text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                <span className="w-1 h-1 rounded-full bg-[#BCB8B1]"></span>
                <span>Deterministic verification</span>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-white border border-[#E7E4DE] rounded-xl p-5 shadow-[0_1px_2px_rgba(70,63,58,0.06)] hover:border-[#BCB8B1] transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C] border border-[#E7E4DE] bg-[#F4F3EE] px-2 py-0.5 rounded">
                    03
                  </span>
                  <CheckCircle2 size={20} className="text-[#8A817C] group-hover:text-[#463F3A] transition-colors" />
                </div>
                <h3 className="text-headline-section font-headline-section text-[#463F3A] mb-2 font-medium">
                  Review &amp; approve
                </h3>
                <p className="text-[#8A817C] text-body-default font-body-default text-[13px] leading-relaxed">
                  Lead confirms claims, answers leaver queries, and ratifies access transfers.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-[#F4F3EE] flex items-center gap-1.5 text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                <span className="w-1 h-1 rounded-full bg-[#BCB8B1]"></span>
                <span>Maya Patel review</span>
              </div>
            </div>

            {/* Step 04 */}
            <div className="bg-white border border-[#E7E4DE] rounded-xl p-5 shadow-[0_1px_2px_rgba(70,63,58,0.06)] hover:border-[#BCB8B1] transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C] border border-[#E7E4DE] bg-[#F4F3EE] px-2 py-0.5 rounded">
                    04
                  </span>
                  <UserCheck size={20} className="text-[#8A817C] group-hover:text-[#463F3A] transition-colors" />
                </div>
                <h3 className="text-headline-section font-headline-section text-[#463F3A] mb-2 font-medium">
                  View as Successor
                </h3>
                <p className="text-[#8A817C] text-body-default font-body-default text-[13px] leading-relaxed">
                  Deliver a clean, permission-aware transition brief directly to Arjun Rao.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-[#F4F3EE] flex items-center gap-1.5 text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                <span className="w-1 h-1 rounded-full bg-[#BCB8B1]"></span>
                <span>Arjun Rao persona</span>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Call-to-Action Area */}
        <section className="text-center mb-16">
          <div className="inline-flex flex-col items-center">
            <button
              type="button"
              onClick={handleLoadDemo}
              disabled={loading}
              className="bg-[#463F3A] hover:bg-[#37312D] active:scale-[0.99] text-white px-8 py-3.5 rounded-[10px] font-body-medium text-body-medium shadow-md transition-all inline-flex items-center gap-2.5 font-medium cursor-pointer"
            >
              <span>{loading ? "Loading CampusConnect Data..." : "Load demo project"}</span>
              <ArrowRight size={18} />
            </button>
            <span className="text-label-caption font-label-caption text-[#8A817C] mt-3">
              Uses synthetic dataset for CampusConnect (4 planted test scenarios)
            </span>
          </div>
        </section>

        {/* Trust Points */}
        <section className="border-t border-[#E7E4DE] pt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Point 1 */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-white border border-[#E7E4DE] text-[#463F3A] shrink-0">
                <FileCheck size={18} />
              </div>
              <div>
                <h4 className="text-headline-section font-headline-section text-[#463F3A] text-sm font-medium mb-1">
                  Evidence-first grounding
                </h4>
                <p className="text-[#8A817C] text-[13px] leading-relaxed">
                  Every claim is paired with an exact verbatim quote and verified by deterministic code.
                </p>
              </div>
            </div>

            {/* Point 2 */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-white border border-[#E7E4DE] text-[#463F3A] shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <h4 className="text-headline-section font-headline-section text-[#463F3A] text-sm font-medium mb-1">
                  Permission-aware access
                </h4>
                <p className="text-[#8A817C] text-[13px] leading-relaxed">
                  Confidential infrastructure credentials and leaver secrets are filtered from successor view.
                </p>
              </div>
            </div>

            {/* Point 3 */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-white border border-[#E7E4DE] text-[#463F3A] shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-headline-section font-headline-section text-[#463F3A] text-sm font-medium mb-1">
                  Zero unapproved leaks
                </h4>
                <p className="text-[#8A817C] text-[13px] leading-relaxed">
                  Nothing is shared with the successor until Maya Patel (Team Lead) explicitly ratifies the brief.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

