import React from "react";
import { Fingerprint, CheckSquare, ShieldCheck } from "lucide-react";

export const Principles: React.FC = () => {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto" id="trust">
      <div className="text-center mb-14">
        <div className="border border-[#E7E4DE] bg-white text-xs font-mono uppercase tracking-wider text-[#8A817C] px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 mb-3 shadow-xs">
          <span>CORE VALUES</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-serif text-[#463F3A] font-normal tracking-tight">
          Built on three quiet guarantees
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Traceable */}
        <div className="bg-white border border-[#E7E4DE] rounded-2xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-[#F4F3EE] border border-[#E7E4DE] flex items-center justify-center text-[#463F3A] mb-5">
              <Fingerprint size={20} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-serif font-medium text-[#463F3A] mb-2">Traceable</h3>
            <p className="text-xs sm:text-sm text-[#8A817C] leading-relaxed">
              Every statement links verbatim to PRs, meeting notes, or RFCs with an immutable audit hash.
              Nothing is synthesized out of thin air.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#E7E4DE] text-[11px] font-mono text-[#8A817C]">
            SHA-256 verifiable provenance
          </div>
        </div>

        {/* 2. Actionable */}
        <div className="bg-white border border-[#E7E4DE] rounded-2xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-[#F4F3EE] border border-[#E7E4DE] flex items-center justify-center text-[#463F3A] mb-5">
              <CheckSquare size={20} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-serif font-medium text-[#463F3A] mb-2">Actionable</h3>
            <p className="text-xs sm:text-sm text-[#8A817C] leading-relaxed">
              Generates day-1 operational checklists, service ownership registries, and dependency maps so
              successors hit the ground running.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#E7E4DE] text-[11px] font-mono text-[#8A817C]">
            Export to Linear, Notion, or Markdown
          </div>
        </div>

        {/* 3. Permission-aware */}
        <div className="bg-white border border-[#E7E4DE] rounded-2xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-full bg-[#F4F3EE] border border-[#E7E4DE] flex items-center justify-center text-[#463F3A] mb-5">
              <ShieldCheck size={20} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-serif font-medium text-[#463F3A] mb-2">Permission-aware</h3>
            <p className="text-xs sm:text-sm text-[#8A817C] leading-relaxed">
              Sensitive credentials, salary notes, and restricted infrastructure are mathematically
              partitioned based on verified organizational clearance.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#E7E4DE] text-[11px] font-mono text-[#8A817C]">
            Zero secret leakage architecture
          </div>
        </div>
      </div>
    </section>
  );
};
