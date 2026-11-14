import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Mail,
  Shield,
  Calendar,
} from "lucide-react";
import { AcknowledgementTrackingResponse, VersionSummary } from "../../types";
import { api } from "../../lib/api";
import { CardSkeleton } from "../Skeletons";

interface AcknowledgementTrackingTabProps {
  versions: VersionSummary[];
  currentUserRole: string;
}

export const AcknowledgementTrackingTab: React.FC<AcknowledgementTrackingTabProps> = ({
  versions,
  currentUserRole,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [tracking, setTracking] = useState<AcknowledgementTrackingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0].version);
    }
  }, [versions, selectedVersion]);

  useEffect(() => {
    if (currentUserRole !== "lead") return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getAcknowledgements(selectedVersion || undefined)
      .then((res) => {
        if (isMounted) setTracking(res);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load acknowledgement tracking.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedVersion, currentUserRole]);

  if (currentUserRole !== "lead") {
    return (
      <div className="bg-white rounded-2xl border border-[#E7E4DE] p-8 text-center shadow-xs">
        <Shield size={36} className="mx-auto text-[#8A817C] mb-2" />
        <h3 className="text-headline-section font-semibold text-[#2B2521]">Lead Clearance Required</h3>
        <p className="text-body-default text-[#5C544F] mt-1">
          Formal receipt acknowledgement tracking is reserved for Team Lead (Maya Patel).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary KPI Card */}
      {tracking && (
        <div className="bg-white rounded-2xl border border-[#E7E4DE] p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8A817C]">
                  Sign-off Compliance
                </span>
                {tracking.current_version && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#EBF2EB] text-[#2D5A27] border border-[#C5DEC3]">
                    Current v{tracking.current_version}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-semibold text-[#2B2521] mt-1">
                {tracking.acknowledged_count} of {tracking.total_recipients} Recipients Acknowledged
              </h3>
              <p className="text-xs text-[#8A817C] mt-1">
                Formal legal acknowledgement ledger confirming successor takeover and receipt of documentation.
              </p>
            </div>

            {/* Version Filter Dropdown */}
            {versions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#8A817C]">Inspect Version:</span>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="text-sm font-medium bg-[#FAF9F5] border border-[#E7E4DE] rounded-xl px-3 py-1.5 text-[#2B2521] focus:outline-hidden focus:ring-2 focus:ring-[#2B2521]"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.version}>
                      v{v.version} {v.is_current ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Progress Breakdown Bar */}
          <div className="mt-6 pt-6 border-t border-[#E7E4DE]">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl border border-[#5F7A61]/30 bg-[#FAF9F5]">
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#5F7A61]">
                  <CheckCircle2 size={13} />
                  <span>Acknowledged</span>
                </div>
                <p className="text-xl font-semibold text-[#2B2521] mt-1">{tracking.acknowledged_count}</p>
              </div>

              <div className="p-3 rounded-xl border border-[#C9822B]/30 bg-[#FAF9F5]">
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#C9822B]">
                  <AlertTriangle size={13} />
                  <span>Outdated</span>
                </div>
                <p className="text-xl font-semibold text-[#2B2521] mt-1">{tracking.outdated_count}</p>
              </div>

              <div className="p-3 rounded-xl border border-[#6B7F94]/30 bg-[#FAF9F5]">
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#6B7F94]">
                  <Clock size={13} />
                  <span>Pending</span>
                </div>
                <p className="text-xl font-semibold text-[#2B2521] mt-1">{tracking.pending_count}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipient Roster Table */}
      <div className="bg-white rounded-2xl border border-[#E7E4DE] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E7E4DE] flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[#8A817C] flex items-center gap-2">
            <UserCheck size={16} className="text-[#2B2521]" />
            Successor Stakeholder Roster
          </h4>
          <span className="text-xs text-[#8A817C]">
            Targeting Version: <strong className="text-[#2B2521]">v{selectedVersion || "latest"}</strong>
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[#BA1A1A] text-sm">{error}</div>
        ) : tracking && tracking.recipients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF9F5] border-b border-[#E7E4DE] text-xs font-semibold text-[#8A817C] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Successor</th>
                  <th className="py-3.5 px-4">Role & Email</th>
                  <th className="py-3.5 px-4">Receipt Status</th>
                  <th className="py-3.5 px-4">Signed Timestamp</th>
                  <th className="py-3.5 px-6">Recipient Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E4DE]">
                {tracking.recipients.map((r) => (
                  <tr key={r.user_id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#2B2521]">{r.name}</div>
                      <span className="text-xs font-mono text-[#8A817C]">@{r.user_id}</span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-xs font-medium text-[#2B2521] capitalize">{r.role}</div>
                      <div className="text-xs text-[#8A817C] flex items-center gap-1 mt-0.5">
                        <Mail size={11} />
                        {r.email}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {r.status === "acknowledged" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EBF2EB] text-[#2D5A27] border border-[#C5DEC3]">
                          <CheckCircle2 size={13} />
                          Acknowledged
                        </span>
                      )}
                      {r.status === "outdated" && (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FEF4E8] text-[#8F5105] border border-[#F8D2A6]">
                            <AlertTriangle size={13} />
                            Outdated
                          </span>
                          <p className="text-[11px] text-[#8A817C]">
                            Acknowledged v{r.previously_acknowledged_version || "earlier"}; needs signoff on current version.
                          </p>
                        </div>
                      )}
                      {r.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F0F4F8] text-[#3C5066] border border-[#C3D2E2]">
                          <Clock size={13} />
                          Pending Receipt
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-xs text-[#5C544F]">
                      {r.acknowledged_at ? (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#8A817C]" />
                          {new Date(r.acknowledged_at).toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-[#8A817C] italic">Unrecorded</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-xs text-[#5C544F]">
                      {r.note ? (
                        <span className="italic">"{r.note}"</span>
                      ) : (
                        <span className="text-[#8A817C] italic">No note provided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[#8A817C]">
            No successor recipients registered for this project.
          </div>
        )}
      </div>
    </div>
  );
};
