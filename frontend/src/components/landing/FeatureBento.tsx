import React, { useState } from "react";

export const FeatureBento: React.FC = () => {
  const [activeRole, setActiveRole] = useState<"riya" | "maya" | "arjun">("riya");

  return (
    <section className="py-16 px-6 max-w-6xl mx-auto" id="features">
      <div className="text-center mb-14">
        <div className="border border-[#E7E4DE] bg-white text-xs font-mono uppercase tracking-wider text-[#8A817C] px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 mb-3 shadow-xs">
          <span>CAPABILITIES</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-serif text-[#463F3A] font-normal tracking-tight">
          Engineered for precision and trust
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card A: Large Card (Span 2 cols) */}
        <div className="md:col-span-2 bg-white border border-[#E7E4DE] rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#E0AFA0]"></span>
              <span className="font-mono text-xs text-[#8A817C] uppercase tracking-wider">
                Verifiable Citations
              </span>
            </div>
            <h3 className="font-serif text-xl font-medium text-[#463F3A] mb-2">
              Every claim, one click from its source
            </h3>
            <p className="text-xs sm:text-sm text-[#8A817C] max-w-lg mb-6 leading-relaxed">
              No synthetic hallucinations or unverified summaries. Each statement cites the exact PR,
              commit hash, or chat message where the team made the call.
            </p>
          </div>
          {/* Mini Claim UI */}
          <div className="bg-[#F4F3EE] border border-[#E7E4DE] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#463F3A]">
                Database connection pool capped at 25 for CAS v3 migration
              </span>
              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#E7E4DE] text-[#463F3A]">
                PR #142
              </span>
            </div>
            <div className="bg-[#F9EBE6] border border-[#E7D6CE] rounded p-2.5 text-xs text-[#463F3A] font-mono leading-relaxed">
              “Setting max_connections=25 on aurora-pg pool. Higher pool sizes caused CAS lock churn in staging run #88.”
            </div>
          </div>
        </div>

        {/* Card B: Uncertainty Shown, Never Hidden */}
        <div className="bg-white border border-[#E7E4DE] rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#8A817C]"></span>
              <span className="font-mono text-xs text-[#8A817C] uppercase tracking-wider">
                Epistemic Clarity
              </span>
            </div>
            <h3 className="font-serif text-xl font-medium text-[#463F3A] mb-2">
              Uncertainty shown, never hidden
            </h3>
            <p className="text-xs text-[#8A817C] leading-relaxed mb-6">
              HandoverTrail explicitly classifies knowledge certainty so the incoming team knows what is solid
              and what is guesswork.
            </p>
          </div>
          {/* 4 Badges Stack */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between bg-[#F4F3EE] px-3 py-2 rounded border border-[#E7E4DE]">
              <span className="flex items-center gap-2 text-[#5F7A61] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#5F7A61]"></span> Verified
              </span>
              <span className="text-[#8A817C]">30 claims</span>
            </div>
            <div className="flex items-center justify-between bg-[#F4F3EE] px-3 py-2 rounded border border-[#E7E4DE]">
              <span className="flex items-center gap-2 text-[#6B7F94] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#6B7F94]"></span> Inferred
              </span>
              <span className="text-[#8A817C]">8 claims</span>
            </div>
            <div className="flex items-center justify-between bg-[#F4F3EE] px-3 py-2 rounded border border-[#E7E4DE]">
              <span className="flex items-center gap-2 text-[#C9822B] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#C9822B]"></span> Conflicting
              </span>
              <span className="text-[#8A817C]">4 items</span>
            </div>
            <div className="flex items-center justify-between bg-[#F4F3EE] px-3 py-2 rounded border border-[#E7E4DE]">
              <span className="flex items-center gap-2 text-[#8A817C] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#8A817C]"></span> Missing evidence
              </span>
              <span className="text-[#8A817C]">6 items</span>
            </div>
          </div>
        </div>

        {/* Card C: Conflicts Side by Side */}
        <div className="bg-white border border-[#E7E4DE] rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#C9822B]"></span>
              <span className="font-mono text-xs text-[#C9822B] uppercase tracking-wider font-semibold">
                Contradiction Resolver
              </span>
            </div>
            <h3 className="font-serif text-xl font-medium text-[#463F3A] mb-2">
              Conflicts side by side
            </h3>
            <p className="text-xs text-[#8A817C] leading-relaxed mb-4">
              Highlights when the documentation contradicts chat decisions before they become production
              outages.
            </p>
          </div>
          <div className="space-y-2.5">
            <div className="p-3 bg-[#F4F3EE] rounded-lg border border-[#E7E4DE]">
              <div className="flex justify-between items-center text-[10px] font-mono text-[#8A817C] mb-1">
                <span>Issue #42 (Docs)</span>
                <span>Oct 1</span>
              </div>
              <p className="text-xs text-[#463F3A]">“Rotate Lambda execution role credentials every 30 days.”</p>
            </div>
            <div className="p-3 bg-[#C9822B]/10 rounded-lg border border-[#C9822B]/30">
              <div className="flex justify-between items-center text-[10px] font-mono text-[#C9822B] font-semibold mb-1">
                <span>Meeting notes (Slack sync)</span>
                <span>Oct 12</span>
              </div>
              <p className="text-xs text-[#463F3A]">“Vault TTL override bumped to 90 days to prevent batch timeouts.”</p>
            </div>
          </div>
        </div>

        {/* Card D: Human in Control */}
        <div className="bg-white border border-[#E7E4DE] rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#463F3A]"></span>
              <span className="font-mono text-xs text-[#8A817C] uppercase tracking-wider">
                Editorial Oversight
              </span>
            </div>
            <h3 className="font-serif text-xl font-medium text-[#463F3A] mb-2">
              Human in control
            </h3>
            <p className="text-xs text-[#8A817C] leading-relaxed mb-6">
              Nothing gets published automatically. The leaver and team lead explicitly confirm, adjust, or
              strike every bullet.
            </p>
          </div>
          <div className="bg-[#F4F3EE] rounded-xl p-4 border border-[#E7E4DE]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <button
                type="button"
                className="flex-1 py-1.5 rounded bg-white text-xs font-medium text-[#5F7A61] border border-[#5F7A61]/30 hover:bg-[#5F7A61]/5 text-center transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                className="flex-1 py-1.5 rounded bg-white text-xs font-medium text-[#463F3A] border border-[#E7E4DE] hover:bg-[#FAF9F5] text-center transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                className="flex-1 py-1.5 rounded bg-white text-xs font-medium text-[#8A817C] border border-[#E7E4DE] hover:bg-[#FAF9F5] text-center transition-colors"
              >
                Reject
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8A817C] pt-2 border-t border-[#E7E4DE]">
              <span>Ratified v3</span>
              <span className="text-[#463F3A] font-medium">Maya Patel (Lead)</span>
            </div>
          </div>
        </div>

        {/* Card E: Role-based Views */}
        <div className="bg-white border border-[#E7E4DE] rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#6B7F94]"></span>
              <span className="font-mono text-xs text-[#8A817C] uppercase tracking-wider">
                Access Boundaries
              </span>
            </div>
            <h3 className="font-serif text-xl font-medium text-[#463F3A] mb-2">
              Role-based views
            </h3>
            <p className="text-xs text-[#8A817C] leading-relaxed mb-4">
              Dynamic perspectives curated specifically for who is reading. Toggle between roles with one
              click.
            </p>
          </div>
          <div>
            {/* Pill Switcher */}
            <div className="bg-[#F4F3EE] p-1 rounded-lg border border-[#E7E4DE] flex items-center gap-1 mb-3 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setActiveRole("riya")}
                className={`flex-1 py-1 text-center rounded transition-all ${
                  activeRole === "riya" ? "bg-white text-[#463F3A] shadow-xs" : "text-[#8A817C]"
                }`}
              >
                Riya (Leaver)
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("maya")}
                className={`flex-1 py-1 text-center rounded transition-all ${
                  activeRole === "maya" ? "bg-white text-[#463F3A] shadow-xs" : "text-[#8A817C]"
                }`}
              >
                Maya (Lead)
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("arjun")}
                className={`flex-1 py-1 text-center rounded transition-all ${
                  activeRole === "arjun" ? "bg-white text-[#463F3A] shadow-xs" : "text-[#8A817C]"
                }`}
              >
                Arjun (Successor)
              </button>
            </div>
            <p className="text-[11px] text-[#8A817C] font-mono leading-tight">
              {activeRole === "arjun"
                ? "Confidential root keys and executive discussions are cleanly redacted from successor view."
                : activeRole === "maya"
                ? "Full administrative clearance with approval authority and credential vault inspection."
                : "Leaver perspective with direct prompts to reconcile pending contradictory evidence."}
            </p>
          </div>
        </div>

        {/* Card F: Exit Interview Questions */}
        <div className="md:col-span-3 bg-white border border-[#E7E4DE] rounded-2xl p-7 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#E0AFA0]"></span>
              <span className="font-mono text-xs text-[#8A817C] uppercase tracking-wider">
                Smart Leaver Inquiries
              </span>
            </div>
            <h3 className="font-serif text-xl font-medium text-[#463F3A] mb-2">
              Automated exit interview prompts
            </h3>
            <p className="text-xs sm:text-sm text-[#8A817C] leading-relaxed">
              Identifies ambiguous git changes and asks the leaver targeted questions before their last day,
              recording the answers directly into the dossier.
            </p>
          </div>
          <div className="w-full md:w-auto flex-1 max-w-lg bg-[#F4F3EE] rounded-xl p-4 border border-[#E7E4DE]">
            <div className="text-[11px] font-mono text-[#8A817C] mb-1">PROMPT #04 TO RIYA SHARMA:</div>
            <p className="text-xs font-medium text-[#463F3A] mb-2">
              “Why was the 90-day Vault TTL override applied before CAS v3 rollout?”
            </p>
            <div className="bg-white p-2.5 rounded border border-[#E7E4DE] text-xs text-[#463F3A] italic font-serif">
              “Because batch token refresh was silently failing under peak load. We filed ticket SEC-104 to
              fix root cause in Q4.”
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

