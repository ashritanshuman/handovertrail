import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Lock,
  ExternalLink,
  ArrowRight,
  PenTool,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { FirstSevenDaysCard } from "../components/FirstSevenDaysCard";
import { HiddenItemsBanner } from "../components/HiddenItemsBanner";
import { useHandover } from "../context/HandoverContext";

export const HandoverPage: React.FC = () => {
  const {
    project,
    handover,
    currentUser,
    switchUser,
    acknowledgeHandover,
    openEvidenceDrawer,
    claims,
  } = useHandover();
  const [acknowledging, setAcknowledging] = useState(false);

  const handleSelectClaim = (claimId: string) => {
    const claim = claims.find((c) => c.id === claimId) || {
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
    if (openEvidenceDrawer) {
      openEvidenceDrawer(claim as any);
    }
  };

  const isApproved = project?.handover_state === "approved" || handover !== null;
  const isSuccessor = currentUser.role === "successor";
  const isAcknowledged = handover?.acknowledged || false;

  const handleAcknowledge = async () => {
    if (!isSuccessor) return;
    setAcknowledging(true);
    try {
      await acknowledgeHandover("Formally acknowledged by Arjun Rao (Successor)");
    } catch (err) {
      console.error(err);
    } finally {
      setAcknowledging(false);
    }
  };

  // If not approved yet, display the approved-gated empty state
  if (!isApproved) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-16">
          <div className="bg-white border border-[#d8d0c0] rounded-2xl p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)] text-center">
            <div className="w-12 h-12 rounded-full bg-[#E0AFA0]/20 text-[#241d18] flex items-center justify-center mx-auto mb-4">
              <Lock size={22} className="text-[#241d18]" />
            </div>
            <h2 className="text-headline-page font-headline-page text-[#241d18] mb-2 font-medium">
              Handover brief pending sign-off
            </h2>
            <p className="text-body-default font-body-default text-[#5C544F] leading-relaxed mb-6">
              The CampusConnect knowledge handover is currently in review. In accordance with zero-leak trust rules,
              the successor cannot view the ratified brief until Maya Patel (Team Lead) explicitly approves it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/review"
                className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] bg-[#2B2521] hover:bg-[#1f1a17] text-white text-body-medium font-medium transition-colors inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2"
              >
                <span>Go to Review Workspace</span>
                <ArrowRight size={16} />
              </Link>
              {currentUser.id !== "maya" && (
                <button
                  type="button"
                  onClick={() => switchUser("maya")}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] border border-[#d8d0c0] hover:bg-[#F4F3EE] text-[#241d18] text-body-medium font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2"
                >
                  Switch to Maya (Lead)
                </button>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="w-full max-w-[55rem] mx-auto py-4 md:py-8 flex-1">
        {/* Document Header & Metadata */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-label-mono-metadata font-label-mono-metadata text-[#6B635E] tracking-wider uppercase mb-2">
            <span>PROJECT DOSSIER</span>
            <span className="text-[#d8d0c0]">·</span>
            <span className="text-[#241d18] font-semibold">CAMPUS-CC-2024Q4</span>
            <span className="text-[#d8d0c0]">·</span>
            <span>HANDOVER BRIEF</span>
          </div>

          <h1 className="text-headline-page font-headline-page text-[#241d18] tracking-tight mb-2 font-medium">
            CampusConnect handover
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-body-medium font-body-medium text-[#5C544F]">
            <span>
              Approved by <strong className="text-[#241d18] font-medium">Maya Patel</strong>, version 3, 9 Nov
            </span>
            <span className="text-[#d8d0c0]">·</span>
            <span className="inline-flex items-center gap-1 text-[#241d18]">
              Formal transition to Arjun Rao (Successor)
              <CheckCircle2 size={16} className="text-[#38523A]" />
            </span>
          </div>

          {/* Redaction Notice Banner */}
          <div className="mt-5">
            <HiddenItemsBanner hiddenCount={handover?.hidden_count ?? 4} />
          </div>
        </header>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Section 1: First 7 Days Orientation Checklist */}
          <FirstSevenDaysCard plan={handover?.plan} onSelectClaim={handleSelectClaim} />

          {/* Section 2: What You Now Own */}
          <section className="bg-white border border-[#d8d0c0] rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#d8d0c0]">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#F4F3EE] flex items-center justify-center text-label-mono-metadata font-label-mono-metadata text-[#241d18] font-semibold">
                  02
                </span>
                <h2 className="text-headline-section font-headline-section text-[#241d18] font-medium">
                  What you now own
                </h2>
              </div>
              <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E]">
                PRIMARY DOMAINS &amp; SERVICES
              </span>
            </div>

            <div className="space-y-4">
              {/* Component 1 */}
              <div className="p-4 rounded-xl border border-[#d8d0c0] bg-[#F4F3EE]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#241d18] font-medium">
                    Event Registration Worker &amp; Ingestion Pipeline
                  </h3>
                  <p className="text-body-default font-body-default text-[#5C544F] mt-0.5">
                    Redis queue decoupled in PR #142, Postgres primary state store
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#d8d0c0] text-[12px] font-mono text-[#241d18]">
                    README-architecture.md
                    <ExternalLink size={12} className="text-[#6B635E]" />
                  </span>
                </div>
              </div>

              {/* Component 2 */}
              <div className="p-4 rounded-xl border border-[#d8d0c0] bg-[#F4F3EE]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#241d18] font-medium">
                    Mobile Push Notification Broker
                  </h3>
                  <p className="text-body-default font-body-default text-[#5C544F] mt-0.5">
                    APNS relay, student push dispatcher, high-concurrency channel handles
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#d8d0c0] text-[12px] font-mono text-[#241d18]">
                    Apple Dev Portal
                    <ExternalLink size={12} className="text-[#6B635E]" />
                  </span>
                </div>
              </div>

              {/* Component 3 */}
              <div className="p-4 rounded-xl border border-[#d8d0c0] bg-[#F4F3EE]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#241d18] font-medium">
                    Terraform Infrastructure Modules
                  </h3>
                  <p className="text-body-default font-body-default text-[#5C544F] mt-0.5">
                    AWS S3 assets bucket, HashiCorp Vault secrets manager &amp; policies
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#d8d0c0] text-[12px] font-mono text-[#241d18]">
                    campus-infra/tf
                    <ExternalLink size={12} className="text-[#6B635E]" />
                  </span>
                </div>
              </div>

              {/* Component 4 */}
              <div className="p-4 rounded-xl border border-[#d8d0c0] bg-[#F4F3EE]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#241d18] font-medium">
                    Frontend Web Client
                  </h3>
                  <p className="text-body-default font-body-default text-[#5C544F] mt-0.5">
                    Tailwind CSS, TypeScript, student orientation portal
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#d8d0c0] text-[12px] font-mono text-[#241d18]">
                    PRD v2.1
                    <ExternalLink size={12} className="text-[#6B635E]" />
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Risks */}
          <section className="bg-white border border-[#d8d0c0] rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#d8d0c0]">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#F4F3EE] flex items-center justify-center text-label-mono-metadata font-label-mono-metadata text-[#241d18] font-semibold">
                  03
                </span>
                <h2 className="text-headline-section font-headline-section text-[#241d18] font-medium">
                  Risks
                </h2>
              </div>
              <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E]">
                AUDIT VERIFICATION GAPS
              </span>
            </div>

            <div className="space-y-4">
              {/* Risk 1 */}
              <div className="p-4 rounded-xl border border-[#d8d0c0] bg-[#F4F3EE]/40 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#C9822B]/15 text-[#8F5105] border border-[#C9822B]/35 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8F5105]" />
                    Conflicting
                  </span>
                  <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-white border border-[#d8d0c0] text-[#241d18]">
                    Sec RFC #04
                  </span>
                </div>
                <p className="text-body-default font-body-default text-[#241d18] leading-relaxed">
                  API key rotation cadence conflict between security RFC #04 (30 days) and Vault TTL (90 days) during CAS migration.
                </p>
                <div className="p-3 bg-[#E0AFA0]/15 border-l-[3px] border-[#8d3b2a] rounded-r-lg text-body-default font-body-default text-[#241d18]">
                  <p className="leading-relaxed">
                    <strong className="font-semibold text-[#241d18]">Audit note:</strong> Vault module currently ignores TTL revocation hooks until CAS v3 stabilizes in late November.
                  </p>
                </div>
              </div>

              {/* Risk 2 */}
              <div className="p-4 rounded-xl border border-[#d8d0c0] bg-[#F4F3EE]/40 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#6B635E]/15 text-[#6B635E] border border-[#6B635E]/35 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6B635E]" />
                    Missing evidence
                  </span>
                  <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-white border border-[#d8d0c0] text-[#241d18]">
                    Audit Log #81
                  </span>
                </div>
                <p className="text-body-default font-body-default text-[#241d18] leading-relaxed">
                  Production push notification credential delivery tied to leaver personal Apple Developer account.
                </p>
                <div className="p-3 bg-[#E0AFA0]/15 border-l-[3px] border-[#8d3b2a] rounded-r-lg text-body-default font-body-default text-[#241d18]">
                  <p className="leading-relaxed">
                    <strong className="font-semibold text-[#241d18]">Audit note:</strong> Team invite sent to dev-admin alias; pending confirmation before individual leaver seat de-provisioning.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Dependencies */}
          <section className="bg-white border border-[#d8d0c0] rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#d8d0c0]">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#F4F3EE] flex items-center justify-center text-label-mono-metadata font-label-mono-metadata text-[#241d18] font-semibold">
                  04
                </span>
                <h2 className="text-headline-section font-headline-section text-[#241d18] font-medium">
                  Dependencies
                </h2>
              </div>
              <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E]">
                EXTERNAL SYSTEMS &amp; INTEGRATIONS
              </span>
            </div>

            <div className="divide-y divide-[#d8d0c0]">
              <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#241d18] font-medium">
                    University Central IT CAS 2.0 OAuth endpoint
                  </h3>
                  <p className="text-body-default font-body-default text-[#5C544F] mt-0.5">
                    Managed by IT Central · Contact: Dave Miller
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F4F3EE] text-[12px] font-mono text-[#241d18] border border-[#d8d0c0]">
                    CAS v2 Spec
                    <ExternalLink size={12} className="text-[#6B635E]" />
                  </span>
                </div>
              </div>

              <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#241d18] font-medium">
                    Campus Orientation Ticketing Postgres Instance
                  </h3>
                  <p className="text-body-default font-body-default text-[#5C544F] mt-0.5">
                    Managed by Core DB team
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F4F3EE] text-[12px] font-mono text-[#241d18] border border-[#d8d0c0]">
                    DB RFC #11
                    <ExternalLink size={12} className="text-[#6B635E]" />
                  </span>
                </div>
              </div>

              <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#241d18] font-medium">
                    AWS S3 Assets Bucket (campusconnect-assets-prod)
                  </h3>
                  <p className="text-body-default font-body-default text-[#5C544F] mt-0.5">
                    Managed via Terraform IAM roles
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F4F3EE] text-[12px] font-mono text-[#241d18] border border-[#d8d0c0]">
                    PR #114
                    <ExternalLink size={12} className="text-[#6B635E]" />
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Key Contacts */}
          <section className="bg-white border border-[#d8d0c0] rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#d8d0c0]">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#F4F3EE] flex items-center justify-center text-label-mono-metadata font-label-mono-metadata text-[#241d18] font-semibold">
                  05
                </span>
                <h2 className="text-headline-section font-headline-section text-[#241d18] font-medium">
                  Key contacts
                </h2>
              </div>
              <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E]">
                GOVERNANCE DIRECTORY
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-default">
                <thead>
                  <tr className="border-b border-[#d8d0c0] text-label-mono-metadata font-label-mono-metadata text-[#6B635E]">
                    <th className="py-2.5 pr-4 font-semibold">NAME &amp; ROLE</th>
                    <th className="py-2.5 px-4 font-semibold">DOMAIN RESPONSIBILITY</th>
                    <th className="py-2.5 pl-4 font-semibold text-right">CONTACT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8d0c0]">
                  <tr>
                    <td className="py-3.5 pr-4 font-medium text-[#241d18] whitespace-nowrap">
                      Maya Patel
                      <span className="block text-[12px] text-[#6B635E] font-normal">Tech Lead</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#241d18] text-body-default">
                      Architecture approvals, emergency escalations, sprint reviews
                    </td>
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <a
                        href="mailto:maya.patel@campusconnect.dev"
                        className="text-[#241d18] hover:underline font-mono text-[12px]"
                      >
                        maya.patel@campusconnect.dev
                      </a>
                    </td>
                  </tr>

                  <tr className="bg-[#F4F3EE]/40">
                    <td className="py-3.5 pr-4 font-medium text-[#241d18] whitespace-nowrap">
                      Arjun Rao <span className="text-[12px] text-[#6B635E] font-normal">(Successor)</span>
                      <span className="block text-[12px] text-[#38523A] font-semibold">Successor</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#241d18] text-body-default">
                      Backend infrastructure, push notification broker, CAS auth
                    </td>
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <a
                        href="mailto:arjun.rao@campusconnect.dev"
                        className="text-[#241d18] hover:underline font-mono text-[12px]"
                      >
                        arjun.rao@campusconnect.dev
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 pr-4 font-medium text-[#241d18] whitespace-nowrap">
                      Riya Sharma
                      <span className="block text-[12px] text-[#6B635E] font-normal">Departing Lead</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#241d18] text-body-default">
                      Architectural rationale queries (emergency contact until 30 Nov)
                    </td>
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <a
                        href="mailto:riya.sharma@campusconnect.dev"
                        className="text-[#241d18] hover:underline font-mono text-[12px]"
                      >
                        riya.sharma@campusconnect.dev
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6: Open Items */}
          <section className="bg-white border border-[#d8d0c0] rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#d8d0c0]">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#F4F3EE] flex items-center justify-center text-label-mono-metadata font-label-mono-metadata text-[#241d18] font-semibold">
                  06
                </span>
                <h2 className="text-headline-section font-headline-section text-[#241d18] font-medium">
                  Open items
                </h2>
              </div>
              <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E]">
                POST-APPROVAL RESOLUTIONS
              </span>
            </div>

            <ul className="space-y-3">
              <li className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-[#d8d0c0] bg-[#F4F3EE]/40">
                <span className="text-body-default font-body-default text-[#241d18]">
                  Revert Vault TTL Lambda hook to 30 days after CAS v3 stabilizes in late November
                </span>
                <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-white border border-[#d8d0c0] text-[#241d18] shrink-0">
                  Issue #42
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-[#d8d0c0] bg-[#F4F3EE]/40">
                <span className="text-body-default font-body-default text-[#241d18]">
                  Confirm Apple Developer team admin invite acceptance
                </span>
                <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-white border border-[#d8d0c0] text-[#241d18] shrink-0">
                  GAP-082
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-[#d8d0c0] bg-[#F4F3EE]/40">
                <span className="text-body-default font-body-default text-[#241d18]">
                  Benchmark 50 concurrent campus zone cache feed under pilot surge
                </span>
                <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-white border border-[#d8d0c0] text-[#241d18] shrink-0">
                  Notion RFC 08
                </span>
              </li>
            </ul>
          </section>

          {/* Bottom Acknowledgement Action Dock */}
          <section className="bg-white border-2 border-[#d8d0c0] rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_-4px_rgba(70,63,58,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-headline-section font-headline-section text-[#241d18] font-semibold">
                    Successor sign-off confirmation
                  </h3>
                  <span
                    className={`text-label-mono-metadata font-label-mono-metadata px-2 py-0.5 rounded font-bold ${
                      isAcknowledged
                        ? "bg-[#5F7A61]/15 text-[#38523A]"
                        : "bg-[#F4F3EE] text-[#6B635E]"
                    }`}
                  >
                    {isAcknowledged ? "ACKNOWLEDGED" : "PENDING RECEPTION"}
                  </span>
                </div>
                <p className="text-body-default text-[#5C544F] leading-normal">
                  {isAcknowledged
                    ? "Arjun Rao has formally confirmed reception of all primary project assets and credentials."
                    : "This records that you have received the handover."}
                </p>
                <p className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E]">
                  Target completion: Within 3 business days of approval
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                {isAcknowledged ? (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#5F7A61]/15 text-[#38523A] border border-[#5F7A61]/30 font-medium text-body-medium">
                    <CheckCircle2 size={18} strokeWidth={2} />
                    <span>Receipt Confirmed</span>
                  </div>
                ) : isSuccessor ? (
                  <button
                    type="button"
                    onClick={handleAcknowledge}
                    disabled={acknowledging}
                    className="bg-[#2B2521] hover:bg-[#1f1a17] active:bg-[#181412] text-white font-medium text-body-medium px-5 py-2.5 rounded-[10px] shadow-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2 disabled:bg-[#6B635E] disabled:cursor-not-allowed"
                  >
                    <PenTool size={16} />
                    <span>{acknowledging ? "Acknowledging..." : "Acknowledge receipt"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchUser("arjun")}
                    className="px-4 py-2.5 rounded-[10px] border border-[#d8d0c0] hover:bg-[#F4F3EE] text-[#241d18] text-body-medium font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2"
                  >
                    Switch to Arjun to acknowledge
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
};
