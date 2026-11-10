import React from "react";
import { Link } from "react-router-dom";

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-[#F4F3EE] border-t border-[#E7E4DE] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left: Wordmark & build credit */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E0AFA0]"></span>
            <span className="font-serif font-semibold text-lg text-[#463F3A]">HandoverTrail</span>
          </div>
          <span className="hidden sm:inline text-[#BCB8B1]">·</span>
          <span className="text-xs font-mono text-[#8A817C]">Built by TechieSharks</span>
        </div>

        {/* Navigation links */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-xs font-medium text-[#8A817C]">
          <a className="hover:text-[#463F3A] transition-colors" href="#how-it-works">
            How it works
          </a>
          <a className="hover:text-[#463F3A] transition-colors" href="#features">
            Features
          </a>
          <a className="hover:text-[#463F3A] transition-colors" href="#trust">
            Trust
          </a>
          <Link className="hover:text-[#463F3A] transition-colors" to="/review">
            Protocol Brief
          </Link>
          <Link className="hover:text-[#463F3A] transition-colors" to="/timeline">
            Audit Logs
          </Link>
        </div>

        {/* Note */}
        <span className="text-[11px] font-mono text-[#8A817C] text-center md:text-right">
          Synthetic demo data for verification review
        </span>
      </div>
    </footer>
  );
};
