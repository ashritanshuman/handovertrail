import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface FinalCTAProps {
  onLoadDemo: () => void;
  isLoading: boolean;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onLoadDemo, isLoading }) => {
  return (
    <section className="px-6 pb-20" id="demo">
      <div className="bg-[#F7EFEA] border border-[#d8d0c0] rounded-3xl p-10 md:p-16 text-center max-w-5xl mx-auto shadow-sm">
        <h2 className="text-3xl sm:text-5xl font-serif text-[#241d18] font-normal tracking-tight mb-4">
          See a handover you can trust.
        </h2>
        <p className="text-subline font-subline text-[#5C544F] max-w-lg mx-auto mb-8 leading-relaxed">
          Inspect the complete verified CampusConnect dossier in under two minutes. Experience how
          certainty transforms team continuity.
        </p>
        <div className="inline-flex flex-col items-center">
          <button
            type="button"
            onClick={onLoadDemo}
            disabled={isLoading}
            className="bg-[#2B2521] text-white px-8 py-4 rounded-full font-medium text-base hover:bg-[#1f1a17] transition-all shadow-md inline-flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2 disabled:bg-[#6B635E] disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Loading demo project...</span>
              </>
            ) : (
              <>
                <span>Load demo project</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
          <span className="text-xs font-mono text-[#6B635E] mt-3">
            Takes about two minutes. Synthetic CampusConnect data.
          </span>
        </div>
      </div>
    </section>
  );
};

