import React, { useState, useEffect } from "react";
import {
  GitCommit,
  CheckCircle2,
  Shield,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "../../components/AppShell";
import { useHandover } from "../../context/HandoverContext";
import { api } from "../../lib/api";
import { VersionSummary } from "../../types";
import { VersionComparisonTab } from "../../components/history/VersionComparisonTab";
import { AcknowledgementTrackingTab } from "../../components/history/AcknowledgementTrackingTab";
import { AuditLogTab } from "../../components/history/AuditLogTab";
import { CardSkeleton } from "../../components/Skeletons";

export const HistoryPage: React.FC = () => {
  const { currentUser, showToast } = useHandover();
  const [activeTab, setActiveTab] = useState<"versions" | "acknowledgements" | "audit">("versions");
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  const fetchVersions = () => {
    setLoading(true);
    setError(null);
    api
      .getVersions()
      .then((res) => {
        setVersions(res);
      })
      .catch((err) => {
        setError(err.message || "Failed to load version history.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVersions();
  }, [currentUser]);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await api.seedHistoryDemo();
      showToast(res.message, "success");
      fetchVersions();
    } catch (err: any) {
      showToast(err.message || "Failed to seed demo history.", "error");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8A817C]">
                Traceability & Governance
              </span>
              <span className="text-xs text-[#8A817C]">•</span>
              <span className="text-xs font-medium text-[#2B2521]">
                Viewing as <strong className="capitalize">{currentUser.name}</strong> ({currentUser.role})
              </span>
            </div>
            <h1 className="text-headline-page font-semibold text-[#2B2521] tracking-tight">
              Version History & Compliance Ledger
            </h1>
            <p className="text-body-default text-[#5C544F] mt-1 max-w-2xl">
              Compare semantic differences across ratified handover snapshots, track formal receipt acknowledgements, and inspect the immutable audit trail.
            </p>
          </div>

          {currentUser.role === "lead" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSeedDemo}
                disabled={isSeeding}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E7E4DE] text-xs font-medium text-[#2B2521] hover:bg-[#FAF9F5] transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles size={14} className="text-[#C9822B]" />
                {isSeeding ? "Seeding..." : "Seed Demo History (v1.0 & v1.1)"}
              </button>

              <button
                onClick={fetchVersions}
                className="p-2 rounded-xl bg-white border border-[#E7E4DE] text-[#8A817C] hover:text-[#2B2521] hover:bg-[#FAF9F5] transition-all cursor-pointer shadow-xs"
                title="Refresh Versions"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Sub-tab Navigation Switcher */}
        <div className="flex items-center gap-2 border-b border-[#E7E4DE] pb-4">
          <button
            onClick={() => setActiveTab("versions")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === "versions"
                ? "bg-[#2B2521] text-white shadow-xs"
                : "bg-white text-[#5C544F] hover:text-[#2B2521] hover:bg-[#FAF9F5] border border-[#E7E4DE]"
            }`}
          >
            <GitCommit size={16} />
            Version Comparison
            {versions.length > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === "versions" ? "bg-white/20 text-white" : "bg-[#FAF9F5] text-[#8A817C]"
                }`}
              >
                {versions.length}
              </span>
            )}
          </button>

          {currentUser.role === "lead" && (
            <>
              <button
                onClick={() => setActiveTab("acknowledgements")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === "acknowledgements"
                    ? "bg-[#2B2521] text-white shadow-xs"
                    : "bg-white text-[#5C544F] hover:text-[#2B2521] hover:bg-[#FAF9F5] border border-[#E7E4DE]"
                }`}
              >
                <CheckCircle2 size={16} />
                Acknowledgement Tracking
              </button>

              <button
                onClick={() => setActiveTab("audit")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeTab === "audit"
                    ? "bg-[#2B2521] text-white shadow-xs"
                    : "bg-white text-[#5C544F] hover:text-[#2B2521] hover:bg-[#FAF9F5] border border-[#E7E4DE]"
                }`}
              >
                <Shield size={16} />
                Audit Log Viewer
              </button>
            </>
          )}
        </div>

        {/* Tab Content Display */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E7E4DE] p-8 shadow-xs space-y-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-[#BA1A1A]/30 p-8 text-center text-[#BA1A1A] shadow-xs">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={fetchVersions}
              className="mt-3 px-4 py-1.5 rounded-xl bg-[#2B2521] text-white text-xs font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {activeTab === "versions" && (
              <VersionComparisonTab
                versions={versions}
                onRefresh={fetchVersions}
                onSeedDemo={handleSeedDemo}
                isSeeding={isSeeding}
                currentUserRole={currentUser.role}
              />
            )}

            {activeTab === "acknowledgements" && (
              <AcknowledgementTrackingTab
                versions={versions}
                currentUserRole={currentUser.role}
              />
            )}

            {activeTab === "audit" && (
              <AuditLogTab currentUserRole={currentUser.role} />
            )}
          </>
        )}
      </main>
    </AppShell>
  );
};
