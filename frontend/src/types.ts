export type ClaimType =
  | "decision"
  | "task"
  | "risk"
  | "dependency"
  | "open_question"
  | "contact";

export type ClaimStatus = "verified" | "inferred" | "conflicting" | "missing";

export type ReviewState = "draft" | "confirmed" | "rejected" | "edited";

export type HandoverState = "draft" | "in_review" | "approved";

export type AccessLevel = 1 | 2 | 3;

export type ClaimOrigin = "llm" | "cache" | "human";

export type UserRole = "leaver" | "lead" | "successor";

export interface User {
  id: "riya" | "maya" | "arjun" | string;
  name: string;
  role: UserRole;
  clearance: number; // 1 = Team, 2 = Lead, 3 = Confidential
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  repo_url?: string;
  handover_state: HandoverState;
  leaver?: User;
  lead?: User;
  created_at: string;
}

export interface EvidenceUnit {
  id: string;
  project_id: string;
  source_type: "github" | "jira" | "meeting_notes" | "slack" | string;
  source_ref: string;
  location?: string;
  author: string;
  timestamp: string;
  text: string;
  access_level: number;
}

export interface ConflictDetail {
  statement_a: string;
  statement_b: string;
}

export interface Claim {
  id: string;
  project_id: string;
  type: ClaimType;
  text: string;
  owner: string;
  status: ClaimStatus;
  evidence_ids: string[];
  quote: string;
  access_level: number;
  review_state: ReviewState;
  version: number;
  origin: ClaimOrigin;
  conflict_details?: ConflictDetail;
  conflict_group_id?: string;
  supporting_evidence?: EvidenceUnit[];
}

export interface Question {
  id: string;
  claim_id?: string;
  text: string;
  answer?: string | null;
  state: "open" | "answered" | "dismissed";
  asked_by: string;
  answered_by?: string;
  created_at: string;
  answered_at?: string;
}

export interface HandoverVersion {
  version: string;
  project_id: string;
  approved_by: string;
  approved_at: string;
  notes?: string;
  viewer_clearance: number;
  claims: Claim[];
  acknowledged: boolean;
}

export interface StatsResponse {
  total_claims: number;
  by_status: {
    verified: number;
    inferred: number;
    conflicting: number;
    missing: number;
    [key: string]: number;
  };
  by_type: {
    decision: number;
    task: number;
    risk: number;
    dependency: number;
    open_question: number;
    contact: number;
    [key: string]: number;
  };
  by_review_state: {
    draft: number;
    confirmed: number;
    rejected: number;
    edited: number;
    [key: string]: number;
  };
  open_gaps_count: number;
  readiness_percentage: number;
  can_approve: boolean;
  conflicts_open?: number;
  conflicts_resolved?: number;
  conflicts_dismissed?: number;
  conflicts_unresolved?: number;
  extraction_origin?: string;
}

// ------------------ CONFLICTS & INTERVIEW (MEMBER 1) ------------------
export type ConflictStatus = "open" | "resolved" | "dismissed" | "unresolved";
export type ConflictResolutionType = "chose_claim" | "corrected" | "dismissed" | "left_unresolved";

export interface ConflictClaimSummary {
  id: string;
  text: string;
  quote: string;
  source_ref?: string;
  source_type?: string;
  author?: string;
  access_level: number;
  review_state: string;
  status: string;
}

export interface LeaverAnswerSummary {
  question_id: string;
  answer: string;
  answered_by?: string;
  answered_at?: string;
}

export interface ConflictGroup {
  id: string;
  project_id: string;
  topic?: string;
  attribute: string;
  entity: string;
  type: "contradiction" | "supersession" | "ambiguous" | string;
  confidence: "high" | "medium" | "low" | string;
  status: ConflictStatus;
  resolution_type?: ConflictResolutionType;
  resolved_claim_id?: string;
  note?: string;
  suggestion?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  claims: ConflictClaimSummary[];
  leaver_answer?: LeaverAnswerSummary;
}

export interface InterviewQuoteItem {
  label: string;
  source_ref: string;
  author: string;
  date: string;
  quote: string;
}

export interface InterviewQuestion {
  id: string;
  kind: string;
  topic?: string;
  conflict_group_id?: string;
  text: string;
  state: "open" | "answered" | "skipped";
  quotes: InterviewQuoteItem[];
  quick_options: string[];
  answer?: string | null;
  answered_at?: string | null;
}

export interface InterviewSession {
  session_id: string;
  leaver_name: string;
  total_count: number;
  answered_count: number;
  skipped_count: number;
  questions: InterviewQuestion[];
}

export interface TimelineEvent {
  id?: string;
  date: string;
  title: string;
  category: string;
  summary: string;
  source_ref: string;
  access_level: number;
  status?: ClaimStatus | string;
  event_type?: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  timestamp: string;
  details?: string;
}
