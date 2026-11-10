import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { ProductMockup } from "./ProductMockup";

interface LandingHeroProps {
  onLoadDemo: () => void;
  isLoading: boolean;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onLoadDemo, isLoading }) => {
  return (
    <section className="relative pt-16 md:pt-24 pb-20 px-6 overflow-hidden">
      {/* Subtle dot-grid backdrop with radial fade */}
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.25] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Outlined Pill Badge */}
        <div className="border border-[#E7E4DE] bg-white text-xs font-mono uppercase tracking-wider text-[#8A817C] px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E0AFA0]"></span>
          <span>Knowledge handover for project teams</span>
        </div>

        {/* Giant Editorial Serif Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-[72px] leading-[1.08] tracking-tight text-[#463F3A] font-serif font-normal max-w-4xl mx-auto">
          Hand over what the documents{" "}
          <span className="italic text-[#C97A63] font-serif">never captured.</span>
        </h1>

        {/* Subline */}
        <p className="text-base sm:text-lg text-[#8A817C] max-w-[580px] mx-auto leading-relaxed mt-6 font-normal">
          HandoverTrail turns scattered repos, chats and meeting notes into a source-linked handover
          that a human approves and each person sees only what they are allowed to see.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <button
            type="button"
            onClick={onLoadDemo}
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#463F3A] text-white px-7 py-3.5 rounded-full font-medium text-base hover:bg-[#352F2B] transition-all shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Loading demo...</span>
              </>
            ) : (
              <>
                <span>Load demo project</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
          <a
            className="w-full sm:w-auto border border-[#E7E4DE] bg-white text-[#463F3A] px-7 py-3.5 rounded-full font-medium text-base hover:bg-[#F4F3EE] transition-all inline-flex items-center justify-center"
            href="#how-it-works"
          >
            See how it works
          </a>
        </div>

        <div className="text-[13px] text-[#8A817C] mt-3 font-mono">
          Synthetic demo data. No sign-up needed.
        </div>

        {/* Embedded Browser Frame Mockup */}
        <ProductMockup />
      </div>
    </section>
  );
};
