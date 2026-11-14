import React, { useState, useEffect } from "react";
import {
  GitCommit,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  FileEdit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Sparkles,
} from "lucide-react";
import { VersionSummary, VersionDiff } from "../../types";
import { api } from "../../lib/api";
import { StatusBadge } from "../StatusBadge";
import { TypeChip } from "../TypeChip";
import { WordDiff } from "./WordDiff";
import { CardSkeleton } from "../Skeletons";

interface VersionComparisonTabProps {
  versions: VersionSummary[];
  onRefresh?: () => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
  currentUserRole: string;
}

export const VersionComparisonTab: React.FC<VersionComparisonTabProps> = ({
  versions,
  onSeedDemo,
  isSeeding,
  currentUserRole,
}) => {
  const [selectedFrom, setSelectedFrom] = useState<string>("");
  const [selectedTo, setSelectedTo] = useState<string>("");
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [loadingDiff, setLoadingDiff] = useState<boolean>(false);
  const [errorDiff, setErrorDiff] = useState<string | null>(null);
  const [showUnchanged, setShowUnchanged] = useState<boolean>(false);

  // Initialize selected versions when versions list is loaded
  useEffect(() => {
    if (versions.length >= 2) {
      // Default: previous vs latest
      setSelectedFrom(versions[1].version);
      setSelectedTo(versions[0].version);
    } else if (versions.length === 1) {
      setSelectedFrom(versions[0].version);
      setSelectedTo(versions[0].version);
    }
  }, [versions]);

  // Fetch diff whenever selected versions change
  useEffect(() => {
    if (!selectedFrom || !selectedTo) return;
    if (currentUserRole !== "lead") return;

    let isMounted = true;
    setLoadingDiff(true);
    setErrorDiff(null);

    api
      .getVersionDiff(selectedFrom, selectedTo)
      .then((res) => {
        if (isMounted) setDiff(res);
      })
      .catch((err) => {
        if (isMounted) {
          setErrorDiff(err.message || "Failed to calculate version diff.");
        }
      })
      .finally(() => {
        if (isMounted) setLoadingDiff(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFrom, selectedTo, currentUserRole]);

  if (currentUserRole === "leaver") {
    return (
      <div className="bg-white rounded-2xl border border-[#E7E4DE] p-8 shadow-xs">
        <h3 className="text-headline-section font-semibold text-[#2B2521] mb-2 flex items-center gap-2">
          <GitCommit size={18} className="text-[#8A817C]" />
          Approved Handover Versions (Metadata View)
        </h3>
        <p className="text-body-default text-[#5C544F] mb-6">
          As departing engineer, you have read-only visibility into version milestones ratified by the team lead.
        </p>

        <div className="space-y-3">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between p-4 rounded-xl border border-[#E7E4DE] bg-[#FAF9F5]"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-base text-[#2B2521]">v{v.version}</span>
                  {v.is_current && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#EBF2EB] text-[#2D5A27] border border-[#C5DEC3]">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8A817C] mt-1">
                  Approved by {v.approved_by} on {new Date(v.approved_at).toLocaleString()}
                </p>
                {v.notes && <p className="text-sm text-[#5C544F] mt-2 italic">"{v.notes}"</p>}
              </div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#8A817C] px-3 py-1 bg-white border border-[#E7E4DE] rounded-lg">
                Protected Content
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E7E4DE] p-12 text-center shadow-xs">
        <GitCommit size={40} className="mx-auto text-[#8A817C] mb-3" />
        <h3 className="text-headline-section font-semibold text-[#2B2521] mb-2">No Handover Versions Ratified</h3>
        <p className="text-body-default text-[#5C544F] max-w-md mx-auto mb-6">
          Handover versions are created when Lead Maya approves the workspace on the Review page. You can also seed a plausible two-version history for demonstration.
        </p>
        <button
          onClick={onSeedDemo}
          disabled={isSeeding}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2B2521] text-white text-sm font-medium hover:bg-[#413934] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Sparkles size={16} />
          {isSeeding ? "Seeding Demo Versions..." : "Seed Demo History (v1.0.0 & v1.1.0)"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compare Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E7E4DE] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-headline-section font-semibold text-[#2B2521] flex items-center gap-2">
              <GitCommit size={18} className="text-[#8A817C]" />
              Handover Version Comparison
            </h3>
            <p className="text-xs text-[#8A817C] mt-0.5">
              Field-level semantic diff highlighting added, removed, and modified claims between versions.
            </p>
          </div>

          {versions.length >= 2 ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#8A817C]">From:</span>
                <select
                  value={selectedFrom}
                  onChange={(e) => setSelectedFrom(e.target.value)}
                  className="text-sm font-medium bg-[#FAF9F5] border border-[#E7E4DE] rounded-xl px-3 py-1.5 text-[#2B2521] focus:outline-hidden focus:ring-2 focus:ring-[#2B2521]"
                >
                  {versions.map((v) => (
                    <option key={`from-${v.id}`} value={v.version}>
                      v{v.version} {v.is_current ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <ArrowRight size={16} className="text-[#8A817C]" />

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#8A817C]">To:</span>
                <select
                  value={selectedTo}
                  onChange={(e) => setSelectedTo(e.target.value)}
                  className="text-sm font-medium bg-[#FAF9F5] border border-[#E7E4DE] rounded-xl px-3 py-1.5 text-[#2B2521] focus:outline-hidden focus:ring-2 focus:ring-[#2B2521]"
                >
                  {versions.map((v) => (
                    <option key={`to-${v.id}`} value={v.version}>
                      v{v.version} {v.is_current ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8A817C] bg-[#FAF9F5] px-3 py-1.5 rounded-lg border border-[#E7E4DE]">
                Only 1 version exists (v{versions[0].version})
              </span>
              <button
                onClick={onSeedDemo}
                disabled={isSeeding}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2B2521] text-white text-xs font-medium hover:bg-[#413934] transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles size={14} />
                {isSeeding ? "Seeding..." : "Seed v1.1.0 to Compare"}
              </button>
            </div>
          )}
        </div>

        {/* Diff Summary Metric Chips */}
        {diff && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#E7E4DE]">
            <div className="p-3 rounded-xl border border-[#E7E4DE] bg-[#FAF9F5]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#8A817C]">Changed</span>
                <FileEdit size={14} className="text-[#C9822B]" />
              </div>
              <p className="text-2xl font-semibold text-[#2B2521] mt-1">{diff.changed.length}</p>
            </div>

            <div className="p-3 rounded-xl border border-[#E7E4DE] bg-[#FAF9F5]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#8A817C]">Added</span>
                <PlusCircle size={14} className="text-[#5F7A61]" />
              </div>
              <p className="text-2xl font-semibold text-[#2B2521] mt-1">{diff.added.length}</p>
            </div>

            <div className="p-3 rounded-xl border border-[#E7E4DE] bg-[#FAF9F5]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#8A817C]">Removed</span>
                <MinusCircle size={14} className="text-[#8A817C]" />
              </div>
              <p className="text-2xl font-semibold text-[#2B2521] mt-1">{diff.removed.length}</p>
            </div>

            <div className="p-3 rounded-xl border border-[#E7E4DE] bg-[#FAF9F5]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#8A817C]">Unchanged</span>
                <CheckCircle2 size={14} className="text-[#6B7F94]" />
              </div>
              <p className="text-2xl font-semibold text-[#2B2521] mt-1">{diff.unchanged_count}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Diff Content Stream */}
      {loadingDiff ? (
        <div className="bg-white rounded-2xl border border-[#E7E4DE] p-8 space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : errorDiff ? (
        <div className="bg-white rounded-2xl border border-[#BA1A1A]/30 p-8 text-center text-[#BA1A1A]">
          <p className="text-sm font-medium">{errorDiff}</p>
        </div>
      ) : diff ? (
        <div className="space-y-6">
          {/* 1. Changed Claims Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#8A817C] flex items-center gap-2">
              <FileEdit size={16} className="text-[#C9822B]" />
              Modified Claims ({diff.changed.length})
            </h4>

            {diff.changed.length === 0 ? (
              <div className="p-6 rounded-xl border border-[#E7E4DE] bg-white text-center text-sm text-[#8A817C]">
                No claims were modified between version {diff.from_version} and {diff.to_version}.
              </div>
            ) : (
              diff.changed.map((c) => (
                <div
                  key={`changed-${c.id}`}
                  className="bg-white rounded-2xl border border-[#C9822B]/40 p-6 shadow-xs space-y-4 hover:border-[#C9822B] transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E4DE] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#8A817C] bg-[#FAF9F5] px-2 py-0.5 rounded-md border border-[#E7E4DE]">
                        {c.id}
                      </span>
                      <TypeChip type={c.type as any} />
                      <StatusBadge status={c.status as any} />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#8A817C]">
                      {c.changed_by && (
                        <span className="flex items-center gap-1 font-medium text-[#2B2521]">
                          <User size={13} />
                          {c.changed_by}
                        </span>
                      )}
                      {c.changed_at && (
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {new Date(c.changed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Word-level Text Diff */}
                  <div>
                    <span className="text-xs font-semibold text-[#8A817C] uppercase tracking-wider block mb-1.5">
                      Statement Change:
                    </span>
                    <WordDiff oldText={c.old_text || ""} newText={c.text} />
                  </div>

                  {/* Ownership / Metadata Transferred */}
                  {c.old_owner && c.owner && c.old_owner !== c.owner && (
                    <div className="flex items-center gap-3 text-xs p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E7E4DE]">
                      <span className="text-[#8A817C] font-medium">Ownership Reassigned:</span>
                      <span className="line-through text-[#8A817C]">{c.old_owner}</span>
                      <ArrowRight size={12} className="text-[#8A817C]" />
                      <span className="font-semibold text-[#2B2521]">{c.owner}</span>
                    </div>
                  )}

                  {/* Why / Reason Note Callout */}
                  {c.note && (
                    <div className="p-3.5 rounded-xl bg-[#FDF1EB] border border-[#E0AFA0]/40 text-xs text-[#2B2521]">
                      <span className="font-semibold text-[#C2705F] block mb-0.5">Rationale ("The Why"):</span>
                      <span>{c.note}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 2. Added Claims Section */}
          {diff.added.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#5F7A61] flex items-center gap-2">
                <PlusCircle size={16} />
                Added Claims ({diff.added.length})
              </h4>

              {diff.added.map((c) => (
                <div
                  key={`added-${c.id}`}
                  className="bg-white rounded-2xl border border-[#5F7A61]/30 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#8A817C] bg-[#FAF9F5] px-2 py-0.5 rounded-md border border-[#E7E4DE]">
                        {c.id}
                      </span>
                      <TypeChip type={c.type as any} />
                      <StatusBadge status={c.status as any} />
                    </div>
                    <span className="text-xs text-[#8A817C]">Owner: {c.owner}</span>
                  </div>
                  <p className="text-sm text-[#2B2521] leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* 3. Removed Claims Section */}
          {diff.removed.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#8A817C] flex items-center gap-2">
                <MinusCircle size={16} />
                Removed Claims ({diff.removed.length})
              </h4>

              {diff.removed.map((c) => (
                <div
                  key={`removed-${c.id}`}
                  className="bg-white rounded-2xl border border-[#E7E4DE] p-5 shadow-xs space-y-3 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#8A817C] bg-[#FAF9F5] px-2 py-0.5 rounded-md border border-[#E7E4DE]">
                        {c.id}
                      </span>
                      <TypeChip type={c.type as any} />
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#FCE8E6] text-[#A51D24]">
                        Removed
                      </span>
                    </div>
                    <span className="text-xs text-[#8A817C]">Ex-Owner: {c.owner}</span>
                  </div>
                  <p className="text-sm text-[#8A817C] line-through leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* 4. Unchanged Claims (Collapsible) */}
          <div className="border border-[#E7E4DE] rounded-2xl bg-white overflow-hidden shadow-xs">
            <button
              onClick={() => setShowUnchanged(!showUnchanged)}
              className="w-full flex items-center justify-between p-4 bg-[#FAF9F5] hover:bg-[#F4F3EE] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#6B7F94]" />
                <span className="text-sm font-medium text-[#2B2521]">
                  Unchanged Claims ({diff.unchanged_count})
                </span>
              </div>
              {showUnchanged ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showUnchanged && (
              <div className="p-4 text-xs text-[#8A817C] bg-white border-t border-[#E7E4DE]">
                {diff.unchanged_count} claims remained identical in text, owner, type, quote, and status between version{" "}
                {diff.from_version} and {diff.to_version}.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
