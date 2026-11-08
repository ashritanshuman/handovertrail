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
export type UserRole = "leaver" | "lead" | "successor";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  clearance: number;
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
  source_type: string;
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
  origin: "llm" | "cache" | "human";
  conflict_details?: ConflictDetail;
}

export interface Question {
  id: string;
  claim_id?: string;
  text: string;
  answer?: string;
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
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  by_review_state: Record<string, number>;
  open_gaps_count: number;
  readiness_percentage: number;
  can_approve: boolean;
}

export interface TimelineEvent {
  date: string;
  title: string;
  category: string;
  summary: string;
  source_ref: string;
  access_level: number;
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
