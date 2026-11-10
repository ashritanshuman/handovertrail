import React from "react";
import { MessageSquare, Wrench, KeyRound } from "lucide-react";

export const ProblemBand: React.FC = () => {
  return (
    <section className="bg-[#463F3A] text-white py-20 px-6 border-y border-[#352F2B]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-normal text-white tracking-tight">
            When someone leaves, the reasoning leaves with them.
          </h2>
          <p className="text-[#BCB8B1] text-sm md:text-base mt-4 font-normal max-w-xl mx-auto leading-relaxed">
            Technical specifications record what was built. They rarely capture the discarded
            alternatives, hidden trade-offs, and critical operational quirks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Col 1 */}
          <div className="md:pr-6 md:border-r md:border-[#BCB8B1]/20 flex flex-col">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-[#BCB8B1]/20 flex items-center justify-center text-[#E0AFA0] mb-5">
              <MessageSquare size={18} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-serif font-medium text-white mb-2">
              Decisions buried in chat threads
            </h3>
            <p className="text-[#BCB8B1] text-xs sm:text-sm leading-relaxed">
              Rationale lost in Slack channels and ephemeral 1:1 huddles that successors never
              search. Months later, teams repeat the same painful architectural dead-ends.
            </p>
          </div>

          {/* Col 2 */}
          <div className="md:pr-6 md:border-r md:border-[#BCB8B1]/20 flex flex-col">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-[#BCB8B1]/20 flex items-center justify-center text-[#E0AFA0] mb-5">
              <Wrench size={18} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-serif font-medium text-white mb-2">
              Work half finished and unowned
            </h3>
            <p className="text-[#BCB8B1] text-xs sm:text-sm leading-relaxed">
              Shadow infrastructure, branch overrides, and partial migrations forgotten after the
              farewell email. New owners spend weeks deducing who owns what service.
            </p>
          </div>

          {/* Col 3 */}
          <div className="flex flex-col">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-[#BCB8B1]/20 flex items-center justify-center text-[#E0AFA0] mb-5">
              <KeyRound size={18} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-serif font-medium text-white mb-2">
              Risks only one person knew
            </h3>
            <p className="text-[#BCB8B1] text-xs sm:text-sm leading-relaxed">
              Expiring credentials, hardcoded vendor tokens, and manual quarterly interventions
              undocumented until a production certificate quietly expires on a weekend.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
