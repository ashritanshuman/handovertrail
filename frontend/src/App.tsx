import { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Lock,
  CheckCircle2,
  HelpCircle,
  Clock,
} from "lucide-react";
import { User, Claim, StatsResponse, Project } from "./types";

const USERS: User[] = [
  {
    id: "riya",
    name: "Riya Sharma",
    role: "leaver",
    clearance: 2,
    email: "riya.sharma@campusconnect.dev",
  },
  {
    id: "maya",
    name: "Maya Patel",
    role: "lead",
    clearance: 2,
    email: "maya.patel@campusconnect.dev",
  },
  {
    id: "arjun",
    name: "Arjun Rao",
    role: "successor",
    clearance: 1,
    email: "arjun.rao@campusconnect.dev",
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(USERS[1]); // Default Maya (Lead)
  const [project, setProject] = useState<Project | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = async (user: User = currentUser) => {
    setLoading(true);
    try {
      // 1. Fetch Project
      const projRes = await fetch("/api/project", {
        headers: { "X-User-Id": user.id },
      });
      if (projRes.ok) {
        setProject(await projRes.json());
      }

      // 2. Fetch Claims
      const claimsRes = await fetch("/api/claims", {
        headers: { "X-User-Id": user.id },
      });
      if (claimsRes.ok) {
        setClaims(await claimsRes.json());
      }

      // 3. Fetch Stats
      const statsRes = await fetch("/api/stats", {
        headers: { "X-User-Id": user.id },
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error("API error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentUser);
  }, [currentUser]);

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    setMessage(`Switched perspective to ${user.name} (Clearance Level ${user.clearance} - ${user.role})`);
    setTimeout(() => setMessage(null), 3500);
  };

  const handleResetDemo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/load", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser.id,
        },
        body: JSON.stringify({ force_reset: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`Demo reset! ${data.evidence_count} evidence units, ${data.claims_loaded} claims loaded.`);
        fetchData(currentUser);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": currentUser.id,
        },
        body: JSON.stringify({ use_cache: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`Extraction complete! ${data.verified_count} verified, ${data.conflicting_count} conflicting.`);
        fetchData(currentUser);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Banner Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-slate-900">
                  HandoverTrail
                </span>
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                  MVP v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Evidence-First, Permission-Aware Knowledge Handover
              </p>
            </div>
          </div>

          {/* User Switcher Pill */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold px-2 text-slate-500 uppercase tracking-wider">
              Viewing As:
            </span>
            {USERS.map((u) => {
              const active = currentUser.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => handleSwitchUser(u)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                    active
                      ? "bg-white text-indigo-700 shadow-sm font-semibold border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <span>{u.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      u.clearance === 2
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    L{u.clearance}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Clearance Context Notification */}
      <div className="bg-indigo-900 text-indigo-100 px-4 py-2 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-indigo-300" />
            <span>
              Active Clearance: <strong>Level {currentUser.clearance} ({currentUser.clearance === 2 ? "Lead-Only" : "Team"})</strong> — Server enforces strict role-filtering before returning data.
            </span>
          </div>
          <span className="text-indigo-300">
            Role: <strong>{currentUser.role.toUpperCase()}</strong>
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        {/* Flash Message */}
        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Project Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {project?.name || "CampusConnect"}
                </h1>
                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>State: {project?.handover_state || "in_review"}</span>
                </span>
              </div>
              <p className="text-slate-600 mt-1 text-sm max-w-2xl">
                {project?.description ||
                  "Campus student event discovery and ticketing platform. Transitioning lead ownership."}
              </p>
              <div className="flex items-center space-x-4 mt-3 text-xs text-slate-500">
                <span>
                  Leaver: <strong>Riya Sharma</strong> (Staff Engineer)
                </span>
                <span>•</span>
                <span>
                  Approver: <strong>Maya Patel</strong> (Engineering Director)
                </span>
                <span>•</span>
                <span>
                  Successor: <strong>Arjun Rao</strong> (Senior Engineer)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleResetDemo}
                disabled={loading}
                className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium transition flex items-center space-x-2"
              >
                <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span>Reset Demo</span>
              </button>
              <button
                onClick={handleExtract}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Extraction</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Handover Readiness
            </span>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              {stats?.readiness_percentage ?? 82.5}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${stats?.readiness_percentage ?? 82.5}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Verified Claims
            </span>
            <div className="text-3xl font-bold text-emerald-700 mt-2">
              {stats?.by_status?.verified ?? 12}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Backed by exact verbatim source quote
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Conflicting / Gaps
            </span>
            <div className="text-3xl font-bold text-amber-600 mt-2">
              {(stats?.by_status?.conflicting ?? 1) + (stats?.open_gaps_count ?? 1)}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Planted conflict & open leaver questions
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
              Viewer Access Scope
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {claims.length} Claims
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Filtered for Clearance Level {currentUser.clearance}
            </p>
          </div>
        </div>

        {/* Claims Explorer */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Extracted Project Knowledge Claims
              </h2>
              <p className="text-xs text-slate-500">
                Every claim is verified character-by-character against ingested commits, PRs, Jira tasks, meeting minutes, and Slack threads.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="all">All Types</option>
                <option value="decision">Decision</option>
                <option value="task">Task</option>
                <option value="risk">Risk</option>
                <option value="dependency">Dependency</option>
                <option value="contact">Contact</option>
                <option value="open_question">Open Question</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="inferred">Inferred</option>
                <option value="conflicting">Conflicting</option>
                <option value="missing">Missing</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {filteredClaims.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No claims match your active filters or clearance level.
              </div>
            ) : (
              filteredClaims.map((claim) => {
                const isVerified = claim.status === "verified";
                const isConflicting = claim.status === "conflicting";
                const isInferred = claim.status === "inferred";

                return (
                  <div
                    key={claim.id}
                    className="p-5 hover:bg-slate-50/70 transition space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-md font-semibold uppercase ${
                            claim.type === "decision"
                              ? "bg-blue-100 text-blue-800"
                              : claim.type === "risk"
                              ? "bg-rose-100 text-rose-800"
                              : claim.type === "task"
                              ? "bg-indigo-100 text-indigo-800"
                              : claim.type === "dependency"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {claim.type}
                        </span>

                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center space-x-1 ${
                            isVerified
                              ? "bg-emerald-100 text-emerald-800"
                              : isConflicting
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isConflicting && <AlertTriangle className="w-3.5 h-3.5" />}
                          {isInferred && <HelpCircle className="w-3.5 h-3.5" />}
                          <span className="capitalize">{claim.status}</span>
                        </span>

                        {claim.access_level === 2 && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded font-semibold flex items-center space-x-1">
                            <Lock className="w-3 h-3" />
                            <span>Lead-Only</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500">
                        Owner: <strong className="text-slate-700">{claim.owner}</strong> • State:{" "}
                        <span className="capitalize">{claim.review_state}</span>
                      </div>
                    </div>

                    <p className="text-slate-900 text-sm font-medium">
                      {claim.text}
                    </p>

                    {/* Verifier Quote Citation */}
                    {claim.quote && (
                      <div className="bg-slate-100/80 rounded-lg p-2.5 text-xs text-slate-600 border border-slate-200/80 flex items-start space-x-2">
                        <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] mt-0.5">
                          Source Quote:
                        </span>
                        <span className="italic font-serif text-slate-800">
                          "{claim.quote}"
                        </span>
                      </div>
                    )}

                    {/* Conflict Callout */}
                    {claim.conflict_details && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-900 space-y-1">
                        <div className="font-semibold flex items-center space-x-1.5 text-red-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Direct Evidence Contradiction Detected:</span>
                        </div>
                        <p className="text-slate-700">
                          <strong>Source A:</strong> {claim.conflict_details.statement_a}
                        </p>
                        <p className="text-slate-700">
                          <strong>Source B:</strong> {claim.conflict_details.statement_b}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Trust Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
            <span>🛡️ Never present assumptions as verified</span>
            <span>•</span>
            <span>🔒 Never expose content above viewer clearance</span>
            <span>•</span>
            <span>✍️ Nothing shared before lead approval</span>
            <span>•</span>
            <span>🧪 Synthetic demo data only</span>
          </div>
          <p className="text-xs text-slate-400">
            HandoverTrail © 2026 Team TchieSharks (Ashrit Anshuman Pradhan, Kush Tayal, Amreesh Sharma)
          </p>
        </div>
      </footer>
    </div>
  );
}
