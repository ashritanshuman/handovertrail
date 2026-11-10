import React, { useState } from "react";

export const FeatureBento: React.FC = () => {
  const [activeRole, setActiveRole] = useState<"riya" | "maya" | "arjun">("riya");

  return (
    <section className="py-16 px-6 max-w-6xl mx-auto" id="features">
      <div className="text-center mb-14">
        <div className="border border-[#d8d0c0] bg-white text-xs font-mono uppercase tracking-wider text-[#6B635E] px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 mb-3 shadow-xs font-semibold">
          <span>CAPABILITIES</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-serif text-[#241d18] font-normal tracking-tight">
          Engineered for precision and trust
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card A: Large Card (Span 2 cols) */}
        <div className="md:col-span-2 bg-white border border-[#d8d0c0] rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#8d3b2a]"></span>
              <span className="font-mono text-xs text-[#6B635E] uppercase tracking-wider font-semibold">
                Verifiable Citations
              </span>
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#241d18] mb-2">
              Every claim, one click from its source
            </h3>
            <p className="text-base text-[#5C544F] max-w-lg mb-6 leading-relaxed">
              No synthetic hallucinations or unverified summaries. Each statement cites the exact PR,
              commit hash, or chat message where the team made the call.
            </p>
          </div>
          {/* Mini Claim UI */}
          <div className="bg-[#F4F3EE] border border-[#d8d0c0] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#241d18]">
                Database connection pool capped at 25 for CAS v3 migration
              </span>
              <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-[#d8d0c0] text-[#241d18] font-medium">
                PR #142
              </span>
            </div>
            <div className="bg-[#F9EBE6] border border-[#d8d0c0] rounded p-2.5 text-xs text-[#241d18] font-mono leading-relaxed">
              “Setting max_connections=25 on aurora-pg pool. Higher pool sizes caused CAS lock churn in staging run #88.”
            </div>
          </div>
        </div>

        {/* Card B: Uncertainty Shown, Never Hidden */}
        <div className="bg-white border border-[#d8d0c0] rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#6B635E]"></span>
              <span className="font-mono text-xs text-[#6B635E] uppercase tracking-wider font-semibold">
                Epistemic Clarity
              </span>
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#241d18] mb-2">
              Uncertainty shown, never hidden
            </h3>
            <p className="text-base text-[#5C544F] leading-relaxed mb-6">
              HandoverTrail explicitly classifies knowledge certainty so the incoming team knows what is solid
              and what is guesswork.
            </p>
          </div>
          {/* 4 Badges Stack */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between bg-[#F4F3EE] px-3 py-2 rounded border border-[#d8d0c0]">
              <span className="flex items-center gap-2 text-[#38523A] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#38523A]"></span> Verified
              </span>
              <span className="text-[#6B635E] font-medium">30 claims</span>
            </div>
            <div className="flex items-center justify-between bg-[#F4F3EE] px-3 py-2 rounded border border-[#d8d0c0]">
              <span className="flex items-center gap-2 text-[#3C5066] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#3C5066]"></span> Inferred
              </span>
              <span className="text-[#6B635E] font-medium">8 claims</span>
            </div>
            <div className="flex items-center justify-between bg-[#F4F3EE] px-3 py-2 rounded border border-[#d8d0c0]">
              <span className="flex items-center gap-2 text-[#8F5105] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#8F5105]"></span> Conflicting
              </span>
              <span className="text-[#6B635E] font-medium">4 items</span>
            </div>
            <div className="flex items-center justify-between bg-[#F4F3EE] px-3 py-2 rounded border border-[#d8d0c0]">
              <span className="flex items-center gap-2 text-[#6B635E] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#6B635E]"></span> Missing evidence
              </span>
              <span className="text-[#6B635E] font-medium">6 items</span>
            </div>
          </div>
        </div>

        {/* Card C: Conflicts Side by Side */}
        <div className="bg-white border border-[#d8d0c0] rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#8F5105]"></span>
              <span className="font-mono text-xs text-[#8F5105] uppercase tracking-wider font-semibold">
                Contradiction Resolver
              </span>
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#241d18] mb-2">
              Conflicts side by side
            </h3>
            <p className="text-base text-[#5C544F] leading-relaxed mb-4">
              Highlights when the documentation contradicts chat decisions before they become production
              outages.
            </p>
          </div>
          <div className="space-y-2.5">
            <div className="p-3 bg-[#F4F3EE] rounded-lg border border-[#d8d0c0]">
              <div className="flex justify-between items-center text-xs font-mono text-[#6B635E] mb-1">
                <span>Issue #42 (Docs)</span>
                <span>Oct 1</span>
              </div>
              <p className="text-xs text-[#241d18] font-medium">“Rotate Lambda execution role credentials every 30 days.”</p>
            </div>
            <div className="p-3 bg-[#C9822B]/15 rounded-lg border border-[#C9822B]/35">
              <div className="flex justify-between items-center text-xs font-mono text-[#8F5105] font-semibold mb-1">
                <span>Meeting notes (Slack sync)</span>
                <span>Oct 12</span>
              </div>
              <p className="text-xs text-[#241d18] font-medium">“Vault TTL override bumped to 90 days to prevent batch timeouts.”</p>
            </div>
          </div>
        </div>

        {/* Card D: Human in Control */}
        <div className="bg-white border border-[#d8d0c0] rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#241d18]"></span>
              <span className="font-mono text-xs text-[#6B635E] uppercase tracking-wider font-semibold">
                Editorial Oversight
              </span>
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#241d18] mb-2">
              Human in control
            </h3>
            <p className="text-base text-[#5C544F] leading-relaxed mb-6">
              Nothing gets published automatically. The leaver and team lead explicitly confirm, adjust, or
              strike every bullet.
            </p>
          </div>
          <div className="bg-[#F4F3EE] rounded-xl p-4 border border-[#d8d0c0]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <button
                type="button"
                className="flex-1 py-1.5 rounded bg-white text-xs font-semibold text-[#38523A] border border-[#5F7A61]/35 hover:bg-[#5F7A61]/10 text-center transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                className="flex-1 py-1.5 rounded bg-white text-xs font-medium text-[#241d18] border border-[#d8d0c0] hover:bg-[#FAF9F5] text-center transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                className="flex-1 py-1.5 rounded bg-white text-xs font-medium text-[#6B635E] border border-[#d8d0c0] hover:bg-[#FAF9F5] text-center transition-colors"
              >
                Reject
              </button>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-[#6B635E] pt-2 border-t border-[#d8d0c0]">
              <span>Ratified v3</span>
              <span className="text-[#241d18] font-semibold">Maya Patel (Lead)</span>
            </div>
          </div>
        </div>

        {/* Card E: Role-based Views */}
        <div className="bg-white border border-[#d8d0c0] rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#3C5066]"></span>
              <span className="font-mono text-xs text-[#6B635E] uppercase tracking-wider font-semibold">
                Access Boundaries
              </span>
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#241d18] mb-2">
              Role-based views
            </h3>
            <p className="text-base text-[#5C544F] leading-relaxed mb-4">
              Dynamic perspectives curated specifically for who is reading. Toggle between roles with one
              click.
            </p>
          </div>
          <div>
            {/* Pill Switcher */}
            <div className="bg-[#F4F3EE] p-1 rounded-lg border border-[#d8d0c0] flex items-center gap-1 mb-3 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveRole("riya")}
                className={`flex-1 py-1 text-center rounded transition-all ${
                  activeRole === "riya" ? "bg-[#2B2521] text-white shadow-xs font-medium" : "text-[#413934] hover:text-[#241d18]"
                }`}
              >
                Riya (Leaver)
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("maya")}
                className={`flex-1 py-1 text-center rounded transition-all ${
                  activeRole === "maya" ? "bg-[#2B2521] text-white shadow-xs font-medium" : "text-[#413934] hover:text-[#241d18]"
                }`}
              >
                Maya (Lead)
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("arjun")}
                className={`flex-1 py-1 text-center rounded transition-all ${
                  activeRole === "arjun" ? "bg-[#2B2521] text-white shadow-xs font-medium" : "text-[#413934] hover:text-[#241d18]"
                }`}
              >
                Arjun (Successor)
              </button>
            </div>
            <p className="text-xs text-[#5C544F] font-mono leading-relaxed">
              {activeRole === "arjun"
                ? "Confidential root keys and executive discussions are cleanly redacted from successor view."
                : activeRole === "maya"
                ? "Full administrative clearance with approval authority and credential vault inspection."
                : "Leaver perspective with direct prompts to reconcile pending contradictory evidence."}
            </p>
          </div>
        </div>

        {/* Card F: Exit Interview Questions */}
        <div className="md:col-span-3 bg-white border border-[#d8d0c0] rounded-2xl p-7 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#8d3b2a]"></span>
              <span className="font-mono text-xs text-[#6B635E] uppercase tracking-wider font-semibold">
                Smart Leaver Inquiries
              </span>
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#241d18] mb-2">
              Automated exit interview prompts
            </h3>
            <p className="text-base text-[#5C544F] leading-relaxed">
              Identifies ambiguous git changes and asks the leaver targeted questions before their last day,
              recording the answers directly into the dossier.
            </p>
          </div>
          <div className="w-full md:w-auto flex-1 max-w-lg bg-[#F4F3EE] rounded-xl p-4 border border-[#d8d0c0]">
            <div className="text-xs font-mono text-[#6B635E] mb-1 font-semibold">PROMPT #04 TO RIYA SHARMA:</div>
            <p className="text-sm font-semibold text-[#241d18] mb-2">
              “Why was the 90-day Vault TTL override applied before CAS v3 rollout?”
            </p>
            <div className="bg-white p-2.5 rounded border border-[#d8d0c0] text-sm text-[#241d18] italic font-serif">
              “Because batch token refresh was silently failing under peak load. We filed ticket SEC-104 to
              fix root cause in Q4.”
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

