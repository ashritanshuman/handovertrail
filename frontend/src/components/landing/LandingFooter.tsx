import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "../Logo";

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-[#F4F3EE] border-t border-[#d8d0c0] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left: Wordmark & build credit */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <Logo size={28} showWordmark={true} wordmarkClassName="font-serif font-semibold text-lg text-[#241d18]" />
          <span className="hidden sm:inline text-[#6B635E]">·</span>
          <span className="text-xs font-mono text-[#6B635E] font-medium">Built by TechieSharks</span>
        </div>

        {/* Navigation links */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm font-medium text-[#413934]">
          <a className="hover:text-[#241d18] transition-colors" href="#how-it-works">
            How it works
          </a>
          <a className="hover:text-[#241d18] transition-colors" href="#features">
            Features
          </a>
          <a className="hover:text-[#241d18] transition-colors" href="#trust">
            Trust
          </a>
          <Link className="hover:text-[#241d18] transition-colors" to="/review">
            Protocol Brief
          </Link>
          <Link className="hover:text-[#241d18] transition-colors" to="/timeline">
            Audit Logs
          </Link>
        </div>

        {/* Note */}
        <span className="text-xs font-mono text-[#6B635E] text-center md:text-right">
          Synthetic demo data for verification review
        </span>
      </div>
    </footer>
  );
};

