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
  const { project, handover, currentUser, switchUser, acknowledgeHandover } = useHandover();
  const [acknowledging, setAcknowledging] = useState(false);

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
          <div className="bg-white border border-[#E7E4DE] rounded-2xl p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)] text-center">
            <div className="w-12 h-12 rounded-full bg-[#E0AFA0]/20 text-[#463F3A] flex items-center justify-center mx-auto mb-4">
              <Lock size={22} className="text-[#463F3A]" />
            </div>
            <h2 className="text-headline-page font-headline-page text-[#463F3A] mb-2 font-medium">
              Handover brief pending sign-off
            </h2>
            <p className="text-body-default font-body-default text-[#8A817C] leading-relaxed mb-6">
              The CampusConnect knowledge handover is currently in review. In accordance with zero-leak trust rules,
              the successor cannot view the ratified brief until Maya Patel (Team Lead) explicitly approves it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/review"
                className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] bg-[#463F3A] hover:bg-[#37312D] text-white text-body-medium font-medium transition-colors inline-flex items-center justify-center gap-2"
              >
                <span>Go to Review Workspace</span>
                <ArrowRight size={16} />
              </Link>
              {currentUser.id !== "maya" && (
                <button
                  type="button"
                  onClick={() => switchUser("maya")}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] border border-[#BCB8B1] hover:bg-[#F4F3EE] text-[#463F3A] text-body-medium font-medium transition-colors"
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
      <div className="w-full max-w-[880px] mx-auto py-4 md:py-8 flex-1">
        {/* Document Header & Metadata */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-label-mono-metadata font-label-mono-metadata text-[#8A817C] tracking-wider uppercase mb-2">
            <span>PROJECT DOSSIER</span>
            <span className="text-[#BCB8B1]">·</span>
            <span className="text-[#463F3A] font-semibold">CAMPUS-CC-2024Q4</span>
            <span className="text-[#BCB8B1]">·</span>
            <span>HANDOVER BRIEF</span>
          </div>

          <h1 className="text-headline-page font-headline-page text-[#463F3A] tracking-tight mb-2 font-medium">
            CampusConnect handover
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-body-medium font-body-medium text-[#8A817C]">
            <span>
              Approved by <strong className="text-[#463F3A] font-medium">Maya Patel</strong>, version 3, 9 Nov
            </span>
            <span className="text-[#BCB8B1]">·</span>
            <span className="inline-flex items-center gap-1 text-[#463F3A]">
              Formal transition to Arjun Rao (Successor)
              <CheckCircle2 size={16} className="text-[#5F7A61]" />
            </span>
          </div>

          {/* Redaction Notice Banner */}
          <div className="mt-5">
            <HiddenItemsBanner hiddenCount={4} />
          </div>
        </header>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Section 1: First 7 Days Orientation Checklist */}
          <FirstSevenDaysCard />

          {/* Section 2: What You Now Own */}
          <section className="bg-white border border-[#E7E4DE] rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E7E4DE]">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#F4F3EE] flex items-center justify-center text-label-mono-metadata font-label-mono-metadata text-[#463F3A] font-semibold">
                  02
                </span>
                <h2 className="text-headline-section font-headline-section text-[#463F3A] font-medium">
                  What you now own
                </h2>
              </div>
              <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                PRIMARY DOMAINS &amp; SERVICES
              </span>
            </div>

            <div className="space-y-4">
              {/* Component 1 */}
              <div className="p-4 rounded-xl border border-[#E7E4DE] bg-[#F4F3EE]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#463F3A] font-medium">
                    Event Registration Worker &amp; Ingestion Pipeline
                  </h3>
                  <p className="text-body-default font-body-default text-[#8A817C] mt-0.5 text-[13px]">
                    Redis queue decoupled in PR #142, Postgres primary state store
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#E7E4DE] text-[12px] font-mono text-[#463F3A]">
                    README-architecture.md
                    <ExternalLink size={11} className="text-[#8A817C]" />
                  </span>
                </div>
              </div>

              {/* Component 2 */}
              <div className="p-4 rounded-xl border border-[#E7E4DE] bg-[#F4F3EE]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#463F3A] font-medium">
                    Mobile Push Notification Broker
                  </h3>
                  <p className="text-body-default font-body-default text-[#8A817C] mt-0.5 text-[13px]">
                    APNS relay, student push dispatcher, high-concurrency channel handles
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#E7E4DE] text-[12px] font-mono text-[#463F3A]">
                    Apple Dev Portal
                    <ExternalLink size={11} className="text-[#8A817C]" />
                  </span>
                </div>
              </div>

              {/* Component 3 */}
              <div className="p-4 rounded-xl border border-[#E7E4DE] bg-[#F4F3EE]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#463F3A] font-medium">
                    Terraform Infrastructure Modules
                  </h3>
                  <p className="text-body-default font-body-default text-[#8A817C] mt-0.5 text-[13px]">
                    AWS S3 assets bucket, HashiCorp Vault secrets manager &amp; policies
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#E7E4DE] text-[12px] font-mono text-[#463F3A]">
                    campus-infra/tf
                    <ExternalLink size={11} className="text-[#8A817C]" />
                  </span>
                </div>
              </div>

              {/* Component 4 */}
              <div className="p-4 rounded-xl border border-[#E7E4DE] bg-[#F4F3EE]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#463F3A] font-medium">
                    Frontend Web Client
                  </h3>
                  <p className="text-body-default font-body-default text-[#8A817C] mt-0.5 text-[13px]">
                    Tailwind CSS, TypeScript, student orientation portal
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#E7E4DE] text-[12px] font-mono text-[#463F3A]">
                    PRD v2.1
                    <ExternalLink size={11} className="text-[#8A817C]" />
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Risks */}
          <section className="bg-white border border-[#E7E4DE] rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E7E4DE]">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#F4F3EE] flex items-center justify-center text-label-mono-metadata font-label-mono-metadata text-[#463F3A] font-semibold">
                  03
                </span>
                <h2 className="text-headline-section font-headline-section text-[#463F3A] font-medium">
                  Risks
                </h2>
              </div>
              <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                AUDIT VERIFICATION GAPS
              </span>
            </div>

            <div className="space-y-4">
              {/* Risk 1 */}
              <div className="p-4 rounded-xl border border-[#E7E4DE] bg-[#F4F3EE]/40 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#C9822B]/12 text-[#C9822B] border border-[#C9822B]/30 font-medium">
                    Conflicting
                  </span>
                  <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-white border border-[#E7E4DE] text-[#463F3A]">
                    Sec RFC #04
                  </span>
                </div>
                <p className="text-body-default font-body-default text-[#463F3A] leading-relaxed">
                  API key rotation cadence conflict between security RFC #04 (30 days) and Vault TTL (90 days) during CAS migration.
                </p>
                <div className="p-3 bg-[#E0AFA0]/12 border-l-[3px] border-[#E0AFA0] rounded-r-lg text-body-default font-body-default text-[#463F3A]">
                  <p className="text-[13px] leading-relaxed">
                    <strong className="font-semibold text-[#463F3A]">Audit note:</strong> Vault module currently ignores TTL revocation hooks until CAS v3 stabilizes in late November.
                  </p>
                </div>
              </div>

              {/* Risk 2 */}
              <div className="p-4 rounded-xl border border-[#E7E4DE] bg-[#F4F3EE]/40 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-caption font-label-caption bg-[#8A817C]/12 text-[#8A817C] border border-[#8A817C]/30 font-medium">
                    Missing evidence
                  </span>
                  <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-white border border-[#E7E4DE] text-[#463F3A]">
                    Audit Log #81
                  </span>
                </div>
                <p className="text-body-default font-body-default text-[#463F3A] leading-relaxed">
                  Production push notification credential delivery tied to leaver personal Apple Developer account.
                </p>
                <div className="p-3 bg-[#E0AFA0]/12 border-l-[3px] border-[#E0AFA0] rounded-r-lg text-body-default font-body-default text-[#463F3A]">
                  <p className="text-[13px] leading-relaxed">
                    <strong className="font-semibold text-[#463F3A]">Audit note:</strong> Team invite sent to dev-admin alias; pending confirmation before individual leaver seat de-provisioning.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Dependencies */}
          <section className="bg-white border border-[#E7E4DE] rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E7E4DE]">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#F4F3EE] flex items-center justify-center text-label-mono-metadata font-label-mono-metadata text-[#463F3A] font-semibold">
                  04
                </span>
                <h2 className="text-headline-section font-headline-section text-[#463F3A] font-medium">
                  Dependencies
                </h2>
              </div>
              <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                EXTERNAL SYSTEMS &amp; INTEGRATIONS
              </span>
            </div>

            <div className="divide-y divide-[#E7E4DE]">
              <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#463F3A] font-medium">
                    University Central IT CAS 2.0 OAuth endpoint
                  </h3>
                  <p className="text-body-default font-body-default text-[#8A817C] mt-0.5 text-[13px]">
                    Managed by IT Central · Contact: Dave Miller
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F4F3EE] text-[12px] font-mono text-[#463F3A]">
                    CAS v2 Spec
                    <ExternalLink size={11} className="text-[#8A817C]" />
                  </span>
                </div>
              </div>

              <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#463F3A] font-medium">
                    Campus Orientation Ticketing Postgres Instance
                  </h3>
                  <p className="text-body-default font-body-default text-[#8A817C] mt-0.5 text-[13px]">
                    Managed by Core DB team
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F4F3EE] text-[12px] font-mono text-[#463F3A]">
                    DB RFC #11
                    <ExternalLink size={11} className="text-[#8A817C]" />
                  </span>
                </div>
              </div>

              <div className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-body-medium font-body-medium text-[#463F3A] font-medium">
                    AWS S3 Assets Bucket (campusconnect-assets-prod)
                  </h3>
                  <p className="text-body-default font-body-default text-[#8A817C] mt-0.5 text-[13px]">
                    Managed via Terraform IAM roles
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F4F3EE] text-[12px] font-mono text-[#463F3A]">
                    PR #114
                    <ExternalLink size={11} className="text-[#8A817C]" />
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Key Contacts */}
          <section className="bg-white border border-[#E7E4DE] rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E7E4DE]">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#F4F3EE] flex items-center justify-center text-label-mono-metadata font-label-mono-metadata text-[#463F3A] font-semibold">
                  05
                </span>
                <h2 className="text-headline-section font-headline-section text-[#463F3A] font-medium">
                  Key contacts
                </h2>
              </div>
              <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                GOVERNANCE DIRECTORY
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-default">
                <thead>
                  <tr className="border-b border-[#E7E4DE] text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                    <th className="py-2.5 pr-4 font-semibold">NAME &amp; ROLE</th>
                    <th className="py-2.5 px-4 font-semibold">DOMAIN RESPONSIBILITY</th>
                    <th className="py-2.5 pl-4 font-semibold text-right">CONTACT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E4DE]">
                  <tr>
                    <td className="py-3.5 pr-4 font-medium text-[#463F3A] whitespace-nowrap">
                      Maya Patel
                      <span className="block text-[12px] text-[#8A817C] font-normal">Tech Lead</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#463F3A] text-[13px]">
                      Architecture approvals, emergency escalations, sprint reviews
                    </td>
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <a
                        href="mailto:maya.patel@campusconnect.dev"
                        className="text-[#463F3A] hover:underline font-mono text-[12px]"
                      >
                        maya.patel@campusconnect.dev
                      </a>
                    </td>
                  </tr>

                  <tr className="bg-[#F4F3EE]/40">
                    <td className="py-3.5 pr-4 font-medium text-[#463F3A] whitespace-nowrap">
                      Arjun Rao <span className="text-[12px] text-[#8A817C] font-normal">(Successor)</span>
                      <span className="block text-[12px] text-[#5F7A61] font-normal">Successor</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#463F3A] text-[13px]">
                      Backend infrastructure, push notification broker, CAS auth
                    </td>
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <a
                        href="mailto:arjun.rao@campusconnect.dev"
                        className="text-[#463F3A] hover:underline font-mono text-[12px]"
                      >
                        arjun.rao@campusconnect.dev
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3.5 pr-4 font-medium text-[#463F3A] whitespace-nowrap">
                      Riya Sharma
                      <span className="block text-[12px] text-[#8A817C] font-normal">Departing Lead</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#463F3A] text-[13px]">
                      Architectural rationale queries (emergency contact until 30 Nov)
                    </td>
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <a
                        href="mailto:riya.sharma@campusconnect.dev"
                        className="text-[#463F3A] hover:underline font-mono text-[12px]"
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
          <section className="bg-white border border-[#E7E4DE] rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E7E4DE]">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#F4F3EE] flex items-center justify-center text-label-mono-metadata font-label-mono-metadata text-[#463F3A] font-semibold">
                  06
                </span>
                <h2 className="text-headline-section font-headline-section text-[#463F3A] font-medium">
                  Open items
                </h2>
              </div>
              <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                POST-APPROVAL RESOLUTIONS
              </span>
            </div>

            <ul className="space-y-3">
              <li className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-[#E7E4DE] bg-[#F4F3EE]/40">
                <span className="text-body-default font-body-default text-[#463F3A] text-[13px]">
                  Revert Vault TTL Lambda hook to 30 days after CAS v3 stabilizes in late November
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-[#E7E4DE] text-[#463F3A] shrink-0">
                  Issue #42
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-[#E7E4DE] bg-[#F4F3EE]/40">
                <span className="text-body-default font-body-default text-[#463F3A] text-[13px]">
                  Confirm Apple Developer team admin invite acceptance
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-[#E7E4DE] text-[#463F3A] shrink-0">
                  GAP-082
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-[#E7E4DE] bg-[#F4F3EE]/40">
                <span className="text-body-default font-body-default text-[#463F3A] text-[13px]">
                  Benchmark 50 concurrent campus zone cache feed under pilot surge
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-[#E7E4DE] text-[#463F3A] shrink-0">
                  Notion RFC 08
                </span>
              </li>
            </ul>
          </section>

          {/* Bottom Acknowledgement Action Dock */}
          <section className="bg-white border-2 border-[#E7E4DE] rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_-4px_rgba(70,63,58,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-headline-section font-headline-section text-[#463F3A] font-semibold">
                    Successor sign-off confirmation
                  </h3>
                  <span
                    className={`text-label-mono-metadata font-label-mono-metadata px-2 py-0.5 rounded font-bold ${
                      isAcknowledged
                        ? "bg-[#5F7A61]/15 text-[#5F7A61]"
                        : "bg-[#F4F3EE] text-[#8A817C]"
                    }`}
                  >
                    {isAcknowledged ? "ACKNOWLEDGED" : "PENDING RECEPTION"}
                  </span>
                </div>
                <p className="text-[13px] text-[#8A817C] leading-normal">
                  {isAcknowledged
                    ? "Arjun Rao has formally confirmed reception of all primary project assets and credentials."
                    : "This records that you have received the handover."}
                </p>
                <p className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
                  Target completion: Within 3 business days of approval
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                {isAcknowledged ? (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#5F7A61]/15 text-[#5F7A61] border border-[#5F7A61]/30 font-medium text-body-medium">
                    <CheckCircle2 size={18} strokeWidth={2} />
                    <span>Receipt Confirmed</span>
                  </div>
                ) : isSuccessor ? (
                  <button
                    type="button"
                    onClick={handleAcknowledge}
                    disabled={acknowledging}
                    className="bg-[#463F3A] hover:bg-[#37312D] active:bg-[#2B2724] text-white font-medium text-body-medium px-5 py-2.5 rounded-[10px] shadow-sm transition-all flex items-center gap-2"
                  >
                    <PenTool size={16} />
                    <span>{acknowledging ? "Acknowledging..." : "Acknowledge receipt"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchUser("arjun")}
                    className="px-4 py-2.5 rounded-[10px] border border-[#BCB8B1] hover:bg-[#F4F3EE] text-[#463F3A] text-body-medium font-medium transition-colors"
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
