import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface FinalCTAProps {
  onLoadDemo: () => void;
  isLoading: boolean;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onLoadDemo, isLoading }) => {
  return (
    <section className="px-6 pb-20" id="demo">
      <div className="bg-[#F7EFEA] border border-[#E7D6CE] rounded-3xl p-10 md:p-16 text-center max-w-5xl mx-auto shadow-sm">
        <h2 className="text-3xl sm:text-5xl font-serif text-[#463F3A] font-normal tracking-tight mb-4">
          See a handover you can trust.
        </h2>
        <p className="text-sm sm:text-base text-[#8A817C] max-w-lg mx-auto mb-8 leading-relaxed">
          Inspect the complete verified CampusConnect dossier in under two minutes. Experience how
          certainty transforms team continuity.
        </p>
        <div className="inline-flex flex-col items-center">
          <button
            type="button"
            onClick={onLoadDemo}
            disabled={isLoading}
            className="bg-[#463F3A] text-white px-8 py-4 rounded-full font-medium text-base hover:bg-[#352F2B] transition-all shadow-md inline-flex items-center gap-2 cursor-pointer disabled:opacity-75"
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
          <span className="text-xs font-mono text-[#8A817C] mt-3">
            Takes about two minutes. Synthetic CampusConnect data.
          </span>
        </div>
      </div>
    </section>
  );
};
