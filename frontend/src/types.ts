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
  sections?: Record<string, Claim[]>;
  first_7_days?: string[];
  plan?: PlanResponse | null;
  hidden_count?: number;
  acknowledged: boolean;
  is_outdated?: boolean;
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

// ------------------ FIRST-7-DAYS PLAN & PREVIEW (MEMBER 3) ------------------
export type PlanCategory = "Understand" | "Fix" | "Decide" | "Contact" | "Handover";
export type PlanPriority = "High" | "Medium" | "Low";
export type PlanEffort = "Short" | "Medium" | "Long";

export interface PlanItem {
  id: string;
  day: number;
  title: string;
  why_it_matters: string;
  category: PlanCategory;
  priority: PlanPriority;
  effort: PlanEffort;
  claim_ids: string[];
  evidence_refs: string[];
  source_label: string;
  is_pinned?: boolean;
  done?: boolean;
}

export interface PlanResponse {
  id: string;
  project_id: string;
  version_id?: string | null;
  status: "draft" | "published";
  role_title: string;
  focus_areas: string[];
  items: PlanItem[];
  is_stale: boolean;
  generated_at: string;
  published_at?: string | null;
  completed_count: number;
  total_items: number;
}

export type ShareCheckSeverity = "block" | "warn" | "info";

export interface ShareCheckFinding {
  severity: ShareCheckSeverity;
  category: string;
  message: string;
  location: string;
}

export interface ShareCheckResponse {
  can_publish: boolean;
  block_count: number;
  warn_count: number;
  info_count: number;
  findings: ShareCheckFinding[];
}

export interface HiddenItemDetail {
  id: string;
  type: string;
  title: string;
  access_level: number;
  reason: string;
}

export interface PreviewResponse {
  mode: "draft" | "approved";
  target_user: User;
  handover: HandoverVersion;
  hidden_items: HiddenItemDetail[];
  confidential_count: number;
  share_check?: ShareCheckResponse;
}

// ------------------ VERSION HISTORY, DIFF & AUDIT (MEMBER 2) ------------------
export interface VersionSummary {
  id: string;
  version: string;
  approved_by: string;
  approved_at: string;
  notes?: string;
  claims_count: number;
  status_counts: Record<string, number>;
  is_current: boolean;
  acknowledgement_summary: string;
}

export interface VersionDetail {
  id: string;
  version: string;
  project_id: string;
  approved_by: string;
  approved_at: string;
  notes?: string;
  viewer_clearance: number;
  claims: Claim[];
  sections?: Record<string, Claim[]>;
  first_7_days?: string[];
  hidden_count: number;
  is_current: boolean;
}

export interface FieldChange {
  field: string;
  old_value: any;
  new_value: any;
}

export interface ClaimDiff {
  id: string;
  type: ClaimType | string;
  text: string;
  old_text?: string;
  owner: string;
  old_owner?: string;
  status: ClaimStatus | string;
  old_status?: string;
  review_state: ReviewState | string;
  old_review_state?: string;
  access_level: number;
  evidence_ids: string[];
  quote?: string;
  field_changes?: FieldChange[];
  changed_by?: string;
  changed_at?: string;
  note?: string;
}

export interface VersionDiff {
  from_version: string;
  to_version: string;
  from_approved_at?: string;
  to_approved_at?: string;
  added: ClaimDiff[];
  removed: ClaimDiff[];
  changed: ClaimDiff[];
  unchanged_count: number;
  total_from: number;
  total_to: number;
}

export interface RecipientAckStatus {
  user_id: string;
  name: string;
  email: string;
  role: string;
  status: "acknowledged" | "pending" | "outdated";
  acknowledged_at?: string | null;
  note?: string;
  previously_acknowledged_version?: string | null;
}

export interface AcknowledgementTrackingResponse {
  current_version: string | null;
  inspected_version: string | null;
  total_recipients: number;
  acknowledged_count: number;
  pending_count: number;
  outdated_count: number;
  recipients: RecipientAckStatus[];
}

export interface AuditLogDetail {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  timestamp: string;
  details?: string;
  actor?: string;
  entity?: string;
  entity_id?: string;
  before_json?: any;
  after_json?: any;
  summary?: string;
}

export interface PaginatedAuditLog {
  items: AuditLogDetail[];
  total: number;
  limit: number;
  cursor?: string | null;
  has_more: boolean;
}

export interface AuditFilterParams {
  actor?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  cursor?: string;
  paginated?: boolean;
}


