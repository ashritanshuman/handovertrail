import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import {
  LandingNav,
  LandingHero,
  ProblemBand,
  HowItWorks,
  FeatureBento,
  PermissionDemo,
  Principles,
  FinalCTA,
  LandingFooter,
} from "../components/landing";
import { useHandover } from "../context/HandoverContext";

export const StartPage: React.FC = () => {
  const navigate = useNavigate();
  const { loadDemoProject, showToast } = useHandover();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loadDemoProject();
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Failed to load demo project:", err);
      const msg = err?.message || "Failed to load demo project. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F4F3EE] text-[#463F3A] font-sans antialiased min-h-screen selection:bg-[#E0AFA0]/30 selection:text-[#352F2B]">
      {/* Optional Top Error Banner */}
      {error && (
        <div
          role="alert"
          className="bg-[#BA1A1A]/10 border-b border-[#BA1A1A]/20 px-4 py-2.5 text-center text-xs font-medium text-[#BA1A1A] flex items-center justify-center gap-2"
        >
          <AlertCircle size={14} />
          <span>{error}</span>
          <button
            type="button"
            onClick={handleLoadDemo}
            className="underline ml-2 hover:text-[#352F2B]"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Floating Nav */}
      <LandingNav onLoadDemo={handleLoadDemo} isLoading={isLoading} />

      {/* Main Long-Scroll Container */}
      <main id="main-content">
        {/* 2. Hero Section with Real ClaimCard and EvidenceDrawer Mockup */}
        <LandingHero onLoadDemo={handleLoadDemo} isLoading={isLoading} />

        {/* 3. Problem Strip (Dark Taupe Band) */}
        <ProblemBand />

        {/* 4. How It Works (4-Step Verification Protocol) */}
        <HowItWorks />

        {/* 5. Features Bento Grid (6 Asymmetric Cards) */}
        <FeatureBento />

        {/* 6. Permission Redaction Demo (Side-by-side Dark Taupe Card) */}
        <PermissionDemo />

        {/* 7. Core Trust Values */}
        <Principles />

        {/* 8. Final Call to Action */}
        <FinalCTA onLoadDemo={handleLoadDemo} isLoading={isLoading} />
      </main>

      {/* 9. Minimal Editorial Footer */}
      <LandingFooter />
    </div>
  );
};
