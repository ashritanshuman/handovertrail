import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";

interface LandingNavProps {
  onLoadDemo: () => void;
  isLoading: boolean;
}

export const LandingNav: React.FC<LandingNavProps> = ({ onLoadDemo, isLoading }) => {
  return (
    <header className="sticky top-6 mx-auto max-w-6xl z-50 px-4 sm:px-6">
      <nav
        aria-label="Landing Navigation"
        className="bg-white/95 backdrop-blur-sm border border-[#E7E4DE] rounded-full px-6 py-3.5 shadow-[0_4px_20px_-4px_rgba(70,63,58,0.06)] flex items-center justify-between"
      >
        {/* Left: HandoverTrail wordmark */}
        <Link
          to="/"
          className="font-serif font-semibold text-xl tracking-tight text-[#463F3A] flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-2 h-2 rounded-full bg-[#E0AFA0]"></span>
          <span>HandoverTrail</span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            className="text-sm font-medium text-[#8A817C] hover:text-[#463F3A] transition-colors"
            href="#how-it-works"
          >
            How it works
          </a>
          <a
            className="text-sm font-medium text-[#8A817C] hover:text-[#463F3A] transition-colors"
            href="#features"
          >
            Features
          </a>
          <a
            className="text-sm font-medium text-[#8A817C] hover:text-[#463F3A] transition-colors"
            href="#trust"
          >
            Trust
          </a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 sm:gap-5">
          <Link
            className="text-sm font-medium text-[#8A817C] hover:text-[#463F3A] transition-colors hidden sm:block"
            to="/dashboard"
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={onLoadDemo}
            disabled={isLoading}
            className="bg-[#463F3A] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#352F2B] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Load demo project</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
};

