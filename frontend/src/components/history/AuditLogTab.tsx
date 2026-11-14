import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Download,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { AuditLogDetail, PaginatedAuditLog } from "../../types";
import { api } from "../../lib/api";
import { CardSkeleton } from "../Skeletons";

interface AuditLogTabProps {
  currentUserRole: string;
}

export const AuditLogTab: React.FC<AuditLogTabProps> = ({ currentUserRole }) => {
  const [logs, setLogs] = useState<AuditLogDetail[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actorFilter, setActorFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("");

  // Pagination state (cursor stack for back navigation)
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // Detail Drawer state
  const [selectedEntry, setSelectedEntry] = useState<AuditLogDetail | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedEntry(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchAuditLogs = (cursorToUse?: string) => {
    if (currentUserRole !== "lead") return;

    setLoading(true);
    setError(null);

    api
      .getAuditPaginated({
        actor: actorFilter || undefined,
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
        q: searchQuery || undefined,
        limit: 25,
        cursor: cursorToUse,
      })
      .then((res: PaginatedAuditLog) => {
        setLogs(res.items);
        setTotalCount(res.total);
        setNextCursor(res.cursor || null);
        setHasMore(res.has_more);
      })
      .catch((err) => {
        setError(err.message || "Failed to load audit trail.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Trigger search / filter reset
  useEffect(() => {
    setCurrentCursor(undefined);
    setCursorHistory([]);
    fetchAuditLogs(undefined);
  }, [actorFilter, actionFilter, entityFilter, searchQuery, currentUserRole]);

  const handleNextPage = () => {
    if (!nextCursor) return;
    setCursorHistory((prev) => [...prev, currentCursor || ""]);
    setCurrentCursor(nextCursor);
    fetchAuditLogs(nextCursor);
  };

  const handlePrevPage = () => {
    if (cursorHistory.length === 0) return;
    const prevHistory = [...cursorHistory];
    const prevCursor = prevHistory.pop();
    setCursorHistory(prevHistory);
    setCurrentCursor(prevCursor || undefined);
    fetchAuditLogs(prevCursor || undefined);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setActorFilter("");
    setActionFilter("");
    setEntityFilter("");
    setCurrentCursor(undefined);
    setCursorHistory([]);
  };

  const handleExportCsv = () => {
    const exportUrl = api.getAuditExportUrl({
      actor: actorFilter || undefined,
      action: actionFilter || undefined,
      entity: entityFilter || undefined,
      q: searchQuery || undefined,
    });
    window.open(exportUrl, "_blank");
  };

  if (currentUserRole !== "lead") {
    return (
      <div className="bg-white rounded-2xl border border-[#E7E4DE] p-8 text-center shadow-xs">
        <Shield size={36} className="mx-auto text-[#8A817C] mb-2" />
        <h3 className="text-headline-section font-semibold text-[#2B2521]">Lead Clearance Required</h3>
        <p className="text-body-default text-[#5C544F] mt-1">
          Full system audit trail inspection is restricted to Team Lead (Maya Patel).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E7E4DE] p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-headline-section font-semibold text-[#2B2521] flex items-center gap-2">
              <Shield size={18} className="text-[#8A817C]" />
              Compliance Audit Trail Ledger
            </h3>
            <p className="text-xs text-[#8A817C] mt-0.5">
              Immutable journal of all human reviews, claim mutations, conflict resolutions, and approvals.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF9F5] border border-[#E7E4DE] text-sm font-medium text-[#2B2521] hover:bg-[#F4F3EE] transition-all cursor-pointer shadow-xs"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4 border-t border-[#E7E4DE]">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search size={15} className="absolute left-3.5 top-3 text-[#8A817C]" />
            <input
              type="text"
              placeholder="Search narrative, ID, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2 bg-[#FAF9F5] border border-[#E7E4DE] rounded-xl text-[#2B2521] placeholder-[#8A817C] focus:outline-hidden focus:ring-2 focus:ring-[#2B2521]"
            />
          </div>

          {/* Actor Select */}
          <div>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-[#FAF9F5] border border-[#E7E4DE] rounded-xl text-[#2B2521] focus:outline-hidden focus:ring-2 focus:ring-[#2B2521]"
            >
              <option value="">All Actors</option>
              <option value="maya">Maya Patel (Lead)</option>
              <option value="riya">Riya Sharma (Leaver)</option>
              <option value="arjun">Arjun Rao (Successor)</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Action Select */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-[#FAF9F5] border border-[#E7E4DE] rounded-xl text-[#2B2521] focus:outline-hidden focus:ring-2 focus:ring-[#2B2521]"
            >
              <option value="">All Actions</option>
              <option value="REVIEW_CLAIM">REVIEW_CLAIM</option>
              <option value="APPROVE_HANDOVER">APPROVE_HANDOVER</option>
              <option value="ACKNOWLEDGE">ACKNOWLEDGE</option>
              <option value="conflict_resolved">conflict_resolved</option>
              <option value="conflict_dismissed">conflict_dismissed</option>
              <option value="interview_answered">interview_answered</option>
              <option value="LOAD_DEMO">LOAD_DEMO</option>
            </select>
          </div>

          {/* Reset Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#8A817C] hover:text-[#2B2521] hover:bg-[#FAF9F5] border border-[#E7E4DE] transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-[#E7E4DE] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E7E4DE] flex items-center justify-between text-xs text-[#8A817C]">
          <span>
            Total Recorded Events: <strong className="text-[#2B2521]">{totalCount}</strong>
          </span>
          <span>Showing page of {logs.length} entries</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[#BA1A1A] text-sm">{error}</div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF9F5] border-b border-[#E7E4DE] text-xs font-semibold text-[#8A817C] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-6">Event Summary</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E4DE]">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedEntry(log)}
                    className="hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-6 text-xs text-[#8A817C] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-xs text-[#2B2521] bg-[#FAF9F5] px-2 py-0.5 rounded-md border border-[#E7E4DE]">
                        @{log.user_id || log.actor}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs font-mono font-medium text-[#2B2521]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-[#8A817C] capitalize">
                      {log.target_type || log.entity} #{log.target_id || log.entity_id}
                    </td>

                    <td className="py-3.5 px-6 text-xs text-[#2B2521]">
                      {log.summary || log.details || "—"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntry(log);
                        }}
                        className="text-xs text-[#8A817C] hover:text-[#2B2521] underline cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[#8A817C]">
            No audit records match the applied criteria.
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#E7E4DE] bg-[#FAF9F5] flex items-center justify-between">
          <button
            onClick={handlePrevPage}
            disabled={cursorHistory.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E4DE] bg-white text-xs font-medium text-[#2B2521] hover:bg-[#FAF9F5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={14} />
            Previous
          </button>

          <span className="text-xs text-[#8A817C]">
            Cursor: <code className="text-[#2B2521]">{currentCursor ? currentCursor.substring(0, 19) : "Latest"}</code>
          </span>

          <button
            onClick={handleNextPage}
            disabled={!hasMore}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E4DE] bg-white text-xs font-medium text-[#2B2521] hover:bg-[#FAF9F5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Row Detail Slide-out Drawer */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-[#2B2521]/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div
            ref={drawerRef}
            className="w-full max-w-xl bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E7E4DE] pb-4">
                <div>
                  <span className="text-xs font-mono text-[#8A817C]">AUDIT EVENT DETAILS</span>
                  <h3 className="text-headline-section font-semibold text-[#2B2521] mt-0.5">
                    {selectedEntry.action}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 rounded-xl text-[#8A817C] hover:text-[#2B2521] hover:bg-[#FAF9F5] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-xl bg-[#FAF9F5] border border-[#E7E4DE]">
                <div>
                  <span className="text-[#8A817C] block mb-0.5">Event ID</span>
                  <span className="font-mono font-medium text-[#2B2521]">{selectedEntry.id}</span>
                </div>
                <div>
                  <span className="text-[#8A817C] block mb-0.5">Timestamp</span>
                  <span className="text-[#2B2521]">{new Date(selectedEntry.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#8A817C] block mb-0.5">Actor</span>
                  <span className="font-semibold text-[#2B2521]">@{selectedEntry.user_id || selectedEntry.actor}</span>
                </div>
                <div>
                  <span className="text-[#8A817C] block mb-0.5">Target Entity</span>
                  <span className="text-[#2B2521]">
                    {selectedEntry.target_type || selectedEntry.entity} #{selectedEntry.target_id || selectedEntry.entity_id}
                  </span>
                </div>
              </div>

              {/* Narrative Summary */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8A817C] block mb-1">
                  Summary
                </span>
                <p className="text-sm text-[#2B2521] p-3 rounded-xl bg-[#FAF9F5] border border-[#E7E4DE]">
                  {selectedEntry.summary || selectedEntry.details || "No narrative generated."}
                </p>
              </div>

              {/* Before vs After Snapshots */}
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8A817C] block">
                  State Mutation Snapshot (Field-Level)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Before */}
                  <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E7E4DE]">
                    <span className="text-xs font-semibold text-[#8A817C] block mb-2">Before State</span>
                    <pre className="text-[11px] font-mono text-[#5C544F] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {selectedEntry.before_json
                        ? JSON.stringify(selectedEntry.before_json, null, 2)
                        : "null (initial state)"}
                    </pre>
                  </div>

                  {/* After */}
                  <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E7E4DE]">
                    <span className="text-xs font-semibold text-[#2B2521] block mb-2">After State</span>
                    <pre className="text-[11px] font-mono text-[#2B2521] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {selectedEntry.after_json
                        ? JSON.stringify(selectedEntry.after_json, null, 2)
                        : "null"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E7E4DE]">
              <button
                onClick={() => setSelectedEntry(null)}
                className="w-full py-2.5 rounded-xl bg-[#2B2521] text-white text-sm font-medium hover:bg-[#413934] transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
