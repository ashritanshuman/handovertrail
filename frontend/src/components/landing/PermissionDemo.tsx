import React from "react";
import { CheckCircle2, Lock, Shield } from "lucide-react";

export const PermissionDemo: React.FC = () => {
  return (
    <section className="py-16 px-6">
      <div className="bg-[#463F3A] rounded-[32px] p-8 md:p-14 text-white max-w-6xl mx-auto shadow-xl">
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-mono tracking-wider text-[#E0AFA0] mb-4 font-semibold">
            <span>ROLE-BASED REDACTION</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-normal tracking-tight text-white mb-4">
            Sees only what they should.
          </h2>
          <p className="text-subline font-subline text-[#F4F3EE] leading-relaxed">
            Permissions are enforced before generation, not after. Successors never receive accidental
            exports of root keys, sensitive personnel feedback, or restricted client vaults.
          </p>
        </div>

        {/* Side-by-side Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel 1: Team Lead (Maya Patel) */}
          <div className="bg-white/5 border border-white/15 rounded-2xl p-6 backdrop-blur-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5F7A61]"></span>
                  <span className="text-base font-semibold text-white">Team Lead view (Maya Patel)</span>
                </div>
                <span className="text-xs font-mono bg-white/15 px-2.5 py-0.5 rounded text-[#F4F3EE] font-medium">
                  Admin Full Clearance
                </span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-white/5 rounded border border-white/10">
                  <div className="text-xs text-[#E7E4DE] mb-1 font-semibold">PROD_AWS_KEY</div>
                  <div className="text-white font-medium">AKIAIOSFODNN7EXAMPLE</div>
                </div>
                <div className="p-3 bg-white/5 rounded border border-white/10">
                  <div className="text-xs text-[#E7E4DE] mb-1 font-semibold">ROOT_DATABASE_URL</div>
                  <div className="text-white font-medium">
                    postgresql://admin:k8s-master-vault@campus-db.internal:5432
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded border border-white/10">
                  <div className="text-xs text-[#E7E4DE] mb-1 font-semibold">MIGRATION_MEMO</div>
                  <div className="text-white font-medium">
                    Unredacted CAS migration timeline &amp; vendor escalation contact notes.
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-white/15 text-xs font-mono text-[#F4F3EE] flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={14} className="text-[#5F7A61]" />
              <span>All 48 claims, secrets and escalation protocols visible</span>
            </div>
          </div>

          {/* Panel 2: Successor View (Arjun Rao) */}
          <div className="bg-white/5 border border-white/15 rounded-2xl p-6 backdrop-blur-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E0AFA0]"></span>
                  <span className="text-base font-semibold text-white">Successor view (Arjun Rao)</span>
                </div>
                <span className="text-xs font-mono bg-white/15 px-2.5 py-0.5 rounded text-[#F4F3EE] font-medium">
                  Standard Engineer
                </span>
              </div>
              {/* Redaction Notice Banner */}
              <div className="mb-3 p-2.5 bg-amber-500/20 border border-amber-400/40 rounded text-xs text-amber-100 flex items-center gap-2 font-medium">
                <Lock size={15} className="text-amber-300" />
                <span className="font-mono text-xs">4 items hidden based on your access level</span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-white/5 rounded border border-white/10">
                  <div className="text-xs text-[#E7E4DE] mb-1 font-semibold">PROD_AWS_KEY</div>
                  <div className="h-4 bg-white/20 rounded w-4/5 select-none" title="Hidden by policy"></div>
                </div>
                <div className="p-3 bg-white/5 rounded border border-white/10">
                  <div className="text-xs text-[#E7E4DE] mb-1 font-semibold">ROOT_DATABASE_URL</div>
                  <div className="h-4 bg-white/20 rounded w-3/5 select-none" title="Hidden by policy"></div>
                </div>
                <div className="p-3 bg-white/5 rounded border border-white/10">
                  <div className="text-xs text-[#E7E4DE] mb-1 font-semibold">MIGRATION_MEMO</div>
                  <div className="text-white font-medium">
                    Clean architecture summary and handover checklist (vendor secrets removed).
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-white/15 text-xs font-mono text-[#F4F3EE] flex items-center gap-1.5 font-medium">
              <Shield size={14} className="text-[#E0AFA0]" />
              <span>Zero leakage risk: secrets stripped at boundary</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

