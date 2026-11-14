import {
  Project,
  Claim,
  Question,
  StatsResponse,
  TimelineEvent,
  HandoverVersion,
  AuditLogEntry,
  EvidenceUnit,
  ReviewState,
  ClaimType,
  ConflictGroup,
  InterviewSession,
  PlanResponse,
  PlanItem,
  PreviewResponse,
  ShareCheckResponse,
} from "../types";
import {
  MOCK_PROJECT,
  MOCK_CLAIMS,
  MOCK_GAPS,
  MOCK_STATS,
  MOCK_TIMELINE,
  MOCK_HANDOVER,
  MOCK_AUDIT,
  MOCK_CONFLICTS,
  MOCK_INTERVIEW,
} from "./mockData";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export function getActiveUserId(): string {
  if (typeof window === "undefined") return "maya";
  return localStorage.getItem("handovertrail_user_id") || "maya";
}

export function setActiveUserId(userId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("handovertrail_user_id", userId);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (USE_MOCK) {
    return handleMockRequest<T>(path, options);
  }

  const userId = getActiveUserId();
  const headers = new Headers(options.headers || {});
  headers.set("X-User-Id", userId);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(path, { ...options, headers });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
      const error: any = new Error(errorBody.detail || "API request failed");
      error.status = res.status;
      throw error;
    }
    return (await res.json()) as T;
  } catch (err: any) {
    // If backend is unreachable (e.g. offline dev or port block), fall back gracefully to mock
    if (!err.status || err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      console.warn(`[HandoverTrail] Backend unreachable at ${path}, falling back to mock fixtures.`, err);
      return handleMockRequest<T>(path, options);
    }
    throw err;
  }
}

// In-memory mock state for when mock mode or offline fallback is active
let localMockClaims = [...MOCK_CLAIMS];
let localMockGaps = [...MOCK_GAPS];
let localMockHandover: HandoverVersion | null = { ...MOCK_HANDOVER };
let localMockStats = { ...MOCK_STATS };
let localMockConflicts = [...MOCK_CONFLICTS];
let localMockInterview = { ...MOCK_INTERVIEW, questions: [...MOCK_INTERVIEW.questions] };

function handleMockRequest<T>(path: string, options: RequestInit): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const userId = getActiveUserId();
  const clearance = userId === "arjun" ? 1 : 2;

  // Small delay to simulate realistic response
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 1. POST /api/demo/load
      if (path.includes("/api/demo/load") && method === "POST") {
        localMockClaims = [...MOCK_CLAIMS];
        localMockGaps = [...MOCK_GAPS];
        localMockStats = { ...MOCK_STATS };
        return resolve({
          status: "success",
          project_id: "campusconnect",
          evidence_count: 52,
          claims_loaded: localMockClaims.length,
          gaps_loaded: localMockGaps.length,
          message: "CampusConnect synthetic dataset loaded successfully.",
        } as unknown as T);
      }

      // 2. GET /api/project
      if (path === "/api/project") {
        return resolve({
          ...MOCK_PROJECT,
          handover_state: localMockHandover ? "approved" : "in_review",
        } as unknown as T);
      }

      // 3. GET /api/evidence
      if (path.startsWith("/api/evidence")) {
        const units: EvidenceUnit[] = localMockClaims
          .flatMap((c) => c.supporting_evidence || [])
          .filter((e) => e.access_level <= clearance);
        return resolve(units as unknown as T);
      }

      // 4. POST /api/extract
      if (path.includes("/api/extract") && method === "POST") {
        return resolve({
          status: "completed",
          extracted_count: 14,
          verified_count: 9,
          conflicting_count: 2,
          inferred_count: 2,
          missing_count: 1,
          duration_ms: 1240,
        } as unknown as T);
      }

      // 5. GET /api/claims
      if (path.startsWith("/api/claims") && method === "GET" && !path.includes("/api/claims/")) {
        const filtered = localMockClaims.filter((c) => c.access_level <= clearance);
        return resolve(filtered as unknown as T);
      }

      // 6. GET /api/claims/{id}
      if (path.startsWith("/api/claims/") && method === "GET") {
        const id = path.split("/api/claims/")[1].split("?")[0];
        const claim = localMockClaims.find((c) => c.id === id);
        if (!claim) {
          const err: any = new Error("Claim not found");
          err.status = 404;
          return reject(err);
        }
        return resolve(claim as unknown as T);
      }

      // 7. PATCH /api/claims/{id}
      if (path.startsWith("/api/claims/") && method === "PATCH") {
        if (userId !== "maya") {
          const err: any = new Error("Permission denied: Lead only");
          err.status = 403;
          return reject(err);
        }
        const id = path.split("/api/claims/")[1].split("?")[0];
        const body = JSON.parse((options.body as string) || "{}");
        const claim = localMockClaims.find((c) => c.id === id);
        if (claim) {
          if (body.review_state) claim.review_state = body.review_state;
          if (body.text) claim.text = body.text;
          if (body.review_state === "confirmed" && claim.status === "conflicting") {
            claim.status = "verified";
          }
          claim.version += 1;
        }
        return resolve(claim as unknown as T);
      }

      // 8. GET /api/gaps
      if (path.startsWith("/api/gaps") && method === "GET") {
        return resolve(localMockGaps as unknown as T);
      }

      // 9. POST /api/gaps/{id}/answer
      if (path.includes("/answer") && method === "POST") {
        const parts = path.split("/");
        const gapId = parts[parts.indexOf("gaps") + 1];
        const body = JSON.parse((options.body as string) || "{}");
        const gap = localMockGaps.find((g) => g.id === gapId);
        if (gap) {
          gap.answer = body.answer;
          gap.state = "answered";
          gap.answered_by = userId;
          gap.answered_at = new Date().toISOString();
        }
        return resolve(gap as unknown as T);
      }

      // 10. GET /api/timeline
      if (path === "/api/timeline") {
        return resolve(MOCK_TIMELINE as unknown as T);
      }

      // 11. GET /api/stats
      if (path === "/api/stats") {
        const visible = localMockClaims.filter((c) => c.access_level <= clearance);
        const verified = visible.filter((c) => c.status === "verified").length;
        const conflicting = visible.filter((c) => c.status === "conflicting").length;
        const total = visible.length;
        const readiness = total > 0 ? Math.round((verified / total) * 1000) / 10 : 0;
        return resolve({
          ...localMockStats,
          total_claims: total,
          readiness_percentage: readiness,
          can_approve: conflicting === 0,
        } as unknown as T);
      }

      // 12. POST /api/approve
      if (path === "/api/approve" && method === "POST") {
        if (userId !== "maya") {
          const err: any = new Error("Forbidden: Lead role required to approve handover.");
          err.status = 403;
          return reject(err);
        }
        localMockHandover = {
          ...MOCK_HANDOVER,
          version: "1.0.0",
          approved_by: "maya",
          approved_at: new Date().toISOString(),
          claims: localMockClaims.filter((c) => c.access_level <= 1),
        };
        return resolve({
          status: "approved",
          version: "1.0.0",
          handover_id: "hv-v1.0",
          approved_by: "maya",
          approved_at: localMockHandover.approved_at,
          claims_included: localMockHandover.claims.length,
          message: "Handover successfully approved and published.",
        } as unknown as T);
      }

      // 13. GET /api/handover
      if (path === "/api/handover") {
        if (!localMockHandover) {
          const err: any = new Error("No approved handover published yet.");
          err.status = 404;
          return reject(err);
        }
        return resolve({
          ...localMockHandover,
          claims: localMockHandover.claims.filter((c) => c.access_level <= clearance),
          viewer_clearance: clearance,
        } as unknown as T);
      }

      // 14. POST /api/acknowledge
      if (path === "/api/acknowledge" && method === "POST") {
        if (localMockHandover) {
          localMockHandover.acknowledged = true;
        }
        return resolve({
          status: "success",
          acknowledgement_id: `ack-${userId}-${Date.now()}`,
          user_id: userId,
          acknowledged_at: new Date().toISOString(),
        } as unknown as T);
      }

      // 15. GET /api/audit
      if (path === "/api/audit") {
        return resolve(MOCK_AUDIT as unknown as T);
      }

      // 16. POST /api/ask
      if (path === "/api/ask" && method === "POST") {
        const body = JSON.parse((options.body as string) || "{}");
        const q = (body.question || "").toLowerCase();
        let ans = "Based on verified project documentation, key decisions were recorded during sprint architecture reviews.";
        let quote = "Riya chose SQLite for prototype to avoid hosting costs during the pilot";
        let source = "Slack #backend";
        if (q.includes("key") || q.includes("rotation") || q.includes("vault")) {
          ans = "External API keys rotate quarterly (every 90 days). The Vault TTL override was signed off in September to prevent CAS authentication token timeouts.";
          quote = "rotate external API keys quarterly (90 days)";
          source = "Meeting notes 15 Sep";
        } else if (q.includes("sqlite") || q.includes("database")) {
          ans = "SQLite with WAL mode was chosen to handle up to 200 concurrent queries with zero lock contention on a single node.";
          quote = "Riya chose SQLite for prototype to avoid hosting costs during the pilot";
          source = "Slack #backend, 3 Oct";
        }
        return resolve({
          answer: ans,
          citations: [
            {
              source_ref: source,
              quote: quote,
              access_level: 1,
            },
          ],
          confidence: "high",
        } as unknown as T);
      }

      // 17. POST /api/conflicts/detect
      if (path === "/api/conflicts/detect" && method === "POST") {
        return resolve(localMockConflicts as unknown as T);
      }

      // 18. GET /api/conflicts
      if (path.startsWith("/api/conflicts") && method === "GET") {
        const parts = path.split("?")[0].split("/").filter(Boolean);
        if (parts.length === 3) {
          const cid = parts[2];
          const found = localMockConflicts.find((c) => c.id === cid);
          return found ? resolve(found as unknown as T) : reject(new Error("Conflict not found"));
        }
        return resolve(localMockConflicts as unknown as T);
      }

      // 19. POST /api/conflicts/{id}/resolve
      if (path.includes("/api/conflicts/") && path.endsWith("/resolve") && method === "POST") {
        const cid = path.split("/")[3];
        const body = JSON.parse((options.body as string) || "{}");
        const idx = localMockConflicts.findIndex((c) => c.id === cid);
        if (idx !== -1) {
          localMockConflicts[idx] = {
            ...localMockConflicts[idx],
            status: "resolved",
            resolution_type: body.resolution_type,
            resolved_claim_id: body.chosen_claim_id || "clm-human-mock",
            resolved_by: userId,
            resolved_at: new Date().toISOString(),
          };
        }
        return resolve({
          status: "resolved",
          conflict_id: cid,
          resolution_type: body.resolution_type,
          resolved_claim_id: body.chosen_claim_id || "clm-human-mock",
          message: "Conflict resolved successfully.",
        } as unknown as T);
      }

      // 20. POST /api/conflicts/{id}/dismiss
      if (path.includes("/api/conflicts/") && path.endsWith("/dismiss") && method === "POST") {
        const cid = path.split("/")[3];
        const body = JSON.parse((options.body as string) || "{}");
        const idx = localMockConflicts.findIndex((c) => c.id === cid);
        if (idx !== -1) {
          localMockConflicts[idx] = {
            ...localMockConflicts[idx],
            status: "dismissed",
            resolution_type: "dismissed",
            note: body.reason,
            resolved_by: userId,
            resolved_at: new Date().toISOString(),
          };
        }
        return resolve({
          status: "dismissed",
          conflict_id: cid,
          message: "Conflict dismissed.",
        } as unknown as T);
      }

      // 21. POST /api/conflicts/{id}/leave-unresolved
      if (path.includes("/api/conflicts/") && path.endsWith("/leave-unresolved") && method === "POST") {
        const cid = path.split("/")[3];
        const body = JSON.parse((options.body as string) || "{}");
        const idx = localMockConflicts.findIndex((c) => c.id === cid);
        if (idx !== -1) {
          localMockConflicts[idx] = {
            ...localMockConflicts[idx],
            status: "unresolved",
            resolution_type: "left_unresolved",
            note: body.reason,
            resolved_by: userId,
            resolved_at: new Date().toISOString(),
          };
        }
        return resolve({
          status: "unresolved",
          conflict_id: cid,
          message: "Conflict marked unresolved.",
        } as unknown as T);
      }

      // 22. GET /api/interview
      if (path === "/api/interview" && method === "GET") {
        return resolve(localMockInterview as unknown as T);
      }

      // 23. POST /api/interview/{id}/answer
      if (path.startsWith("/api/interview/") && path.endsWith("/answer") && method === "POST") {
        const qid = path.split("/")[3];
        const body = JSON.parse((options.body as string) || "{}");
        const q = localMockInterview.questions.find((x) => x.id === qid);
        if (q) {
          q.state = "answered";
          q.answer = body.answer;
          q.answered_at = new Date().toISOString();
        }
        localMockInterview.answered_count = localMockInterview.questions.filter((x) => x.state === "answered").length;
        return resolve({
          status: "answered",
          question_id: qid,
          state: "answered",
          answer: body.answer,
          message: "Answer recorded.",
        } as unknown as T);
      }

      // 24. POST /api/interview/{id}/skip
      if (path.startsWith("/api/interview/") && path.endsWith("/skip") && method === "POST") {
        const qid = path.split("/")[3];
        const q = localMockInterview.questions.find((x) => x.id === qid);
        if (q) {
          q.state = "skipped";
        }
        localMockInterview.skipped_count = localMockInterview.questions.filter((x) => x.state === "skipped").length;
        return resolve({
          status: "skipped",
          question_id: qid,
          state: "skipped",
          message: "Question skipped.",
        } as unknown as T);
      }

      // Fallback
      return resolve({} as unknown as T);
    }, 120);
  });
}

// ----------------- Typed API Client Methods -----------------

export const api = {
  loadDemo: (forceReset = true) =>
    request<{ status: string; evidence_count: number; claims_loaded: number; gaps_loaded: number }>(
      "/api/demo/load",
      {
        method: "POST",
        body: JSON.stringify({ force_reset: forceReset, project_id: "campusconnect" }),
      }
    ),

  getProject: () => request<Project>("/api/project"),

  getEvidence: (sourceType?: string) => {
    const query = sourceType ? `?source_type=${encodeURIComponent(sourceType)}` : "";
    return request<EvidenceUnit[]>(`/api/evidence${query}`);
  },

  extractClaims: (useCache = true) =>
    request<{
      status: string;
      extracted_count: number;
      verified_count: number;
      conflicting_count: number;
      inferred_count: number;
      missing_count: number;
      duration_ms: number;
    }>("/api/extract", {
      method: "POST",
      body: JSON.stringify({ project_id: "campusconnect", use_cache: useCache }),
    }),

  getClaims: (type?: string, status?: string) => {
    const params = new URLSearchParams();
    if (type && type !== "all") params.set("type", type);
    if (status && status !== "all") params.set("status", status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<Claim[]>(`/api/claims${qs}`);
  },

  getClaim: (id: string) => request<Claim>(`/api/claims/${encodeURIComponent(id)}`),

  patchClaim: (
    id: string,
    payload: {
      review_state?: ReviewState;
      text?: string;
      quote?: string;
      owner?: string;
      type?: ClaimType;
    }
  ) =>
    request<Claim>(`/api/claims/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getGaps: (state?: string) => {
    const query = state && state !== "all" ? `?state=${encodeURIComponent(state)}` : "";
    return request<Question[]>(`/api/gaps${query}`);
  },

  answerGap: (id: string, answer: string) =>
    request<Question>(`/api/gaps/${encodeURIComponent(id)}/answer`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    }),

  getTimeline: () => request<TimelineEvent[]>("/api/timeline"),

  getStats: () => request<StatsResponse>("/api/stats"),

  approveHandover: (notes: string) =>
    request<{
      status: string;
      version: string;
      handover_id: string;
      approved_by: string;
      approved_at: string;
      claims_included: number;
      message: string;
    }>("/api/approve", {
      method: "POST",
      body: JSON.stringify({ project_id: "campusconnect", notes }),
    }),

  getHandover: () => request<HandoverVersion>("/api/handover"),

  acknowledgeHandover: (handoverVersionId: string, note?: string) =>
    request<{ status: string; acknowledgement_id: string; user_id: string; acknowledged_at: string }>(
      "/api/acknowledge",
      {
        method: "POST",
        body: JSON.stringify({ handover_version_id: handoverVersionId, note: note || "" }),
      }
    ),

  getAudit: () => request<AuditLogEntry[]>("/api/audit"),

  ask: (question: string) =>
    request<{
      answer: string;
      citations: Array<{ source_ref: string; quote: string; access_level: number }>;
      confidence: string;
    }>("/api/ask", {
      method: "POST",
      body: JSON.stringify({ project_id: "campusconnect", question }),
    }),

  // Conflicts (Member 1)
  detectConflicts: () =>
    request<ConflictGroup[]>("/api/conflicts/detect", { method: "POST" }),

  getConflicts: (statusFilter?: string, typeFilter?: string) => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<ConflictGroup[]>(`/api/conflicts${qs}`);
  },

  getConflict: (id: string) =>
    request<ConflictGroup>(`/api/conflicts/${encodeURIComponent(id)}`),

  resolveConflict: (
    id: string,
    payload: {
      resolution_type: "chose_claim" | "corrected";
      chosen_claim_id?: string;
      corrected_claim?: { text: string; quote?: string; type?: string; owner?: string };
      note?: string;
    }
  ) =>
    request<{
      status: string;
      conflict_id: string;
      resolution_type: string;
      resolved_claim_id?: string;
      message: string;
    }>(`/api/conflicts/${encodeURIComponent(id)}/resolve`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  dismissConflict: (id: string, reason: string) =>
    request<{ status: string; conflict_id: string; message: string }>(
      `/api/conflicts/${encodeURIComponent(id)}/dismiss`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      }
    ),

  leaveConflictUnresolved: (id: string, reason: string) =>
    request<{ status: string; conflict_id: string; message: string }>(
      `/api/conflicts/${encodeURIComponent(id)}/leave-unresolved`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      }
    ),

  // Exit Interview (Member 1)
  getInterview: () => request<InterviewSession>("/api/interview"),

  answerInterviewQuestion: (id: string, answer: string) =>
    request<{
      status: string;
      question_id: string;
      state: string;
      answer: string;
      message: string;
    }>(`/api/interview/${encodeURIComponent(id)}/answer`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    }),

  skipInterviewQuestion: (id: string, reason?: string) =>
    request<{ status: string; question_id: string; state: string; message: string }>(
      `/api/interview/${encodeURIComponent(id)}/skip`,
      {
        method: "POST",
        body: JSON.stringify({ reason: reason || "I don't recall" }),
      }
    ),

  // Member 3: First-7-Days Plan & Preview APIs
  generatePlan: (role_title?: string, focus_areas?: string[]) =>
    request<PlanResponse>("/api/plan/generate", {
      method: "POST",
      body: JSON.stringify({ project_id: "campusconnect", role_title, focus_areas }),
    }),

  getPlan: () => request<PlanResponse>("/api/plan?project_id=campusconnect"),

  updatePlanItem: (itemId: string, patch: Partial<PlanItem>) =>
    request<PlanResponse>(`/api/plan/items/${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  deletePlanItem: (itemId: string) =>
    request<PlanResponse>(`/api/plan/items/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    }),

  publishPlan: (acknowledge_warnings = false) =>
    request<PlanResponse>("/api/plan/publish", {
      method: "POST",
      body: JSON.stringify({ project_id: "campusconnect", acknowledge_warnings }),
    }),

  togglePlanProgress: (itemId: string, done: boolean) =>
    request<{ status: string; item_id: string; done: boolean }>(
      `/api/plan/items/${encodeURIComponent(itemId)}/progress`,
      {
        method: "PATCH",
        body: JSON.stringify({ done }),
      }
    ),

  getPreview: (mode: "draft" | "approved" = "draft") =>
    request<PreviewResponse>(`/api/preview?mode=${mode}&project_id=campusconnect`),

  getShareCheck: () => request<ShareCheckResponse>("/api/preview/check?project_id=campusconnect"),
};

