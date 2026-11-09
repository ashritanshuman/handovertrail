import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  User,
  Project,
  Claim,
  Question,
  StatsResponse,
  TimelineEvent,
  HandoverVersion,
  AuditLogEntry,
  EvidenceUnit,
  ClaimType,
} from "../types";
import { api, getActiveUserId, setActiveUserId } from "../lib/api";

export const USERS: User[] = [
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

interface ToastMessage {
  id: string;
  type: "success" | "info" | "warning" | "error";
  text: string;
}

interface HandoverContextType {
  currentUser: User;
  switchUser: (userId: string) => Promise<void>;
  project: Project | null;
  stats: StatsResponse | null;
  claims: Claim[];
  gaps: Question[];
  timeline: TimelineEvent[];
  handover: HandoverVersion | null;
  audit: AuditLogEntry[];
  selectedClaim: Claim | null;
  selectedEvidence: EvidenceUnit | null;
  isEvidenceDrawerOpen: boolean;
  openEvidenceDrawer: (claim: Claim, evidence?: EvidenceUnit) => void;
  closeEvidenceDrawer: () => void;
  loading: boolean;
  error: string | null;
  toast: ToastMessage | null;
  showToast: (text: string, type?: "success" | "info" | "warning" | "error") => void;
  loadDemoProject: () => Promise<void>;
  runAnalysis: (useCache?: boolean) => Promise<{
    extracted_count: number;
    verified_count: number;
    conflicting_count: number;
    duration_ms: number;
  }>;
  confirmClaim: (id: string) => Promise<void>;
  rejectClaim: (id: string) => Promise<void>;
  editClaim: (id: string, text: string, quote?: string, type?: ClaimType) => Promise<void>;
  answerGap: (id: string, answer: string) => Promise<void>;
  approveHandover: (notes: string) => Promise<void>;
  acknowledgeHandover: (note?: string) => Promise<void>;
  askQuestion: (question: string) => Promise<{
    answer: string;
    citations: Array<{ source_ref: string; quote: string; access_level: number }>;
  }>;
  refreshData: () => Promise<void>;
}

const HandoverContext = createContext<HandoverContextType | undefined>(undefined);

export const HandoverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialUserId = getActiveUserId();
  const initialUser = USERS.find((u) => u.id === initialUserId) || USERS[1]; // default Maya (Lead)

  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [gaps, setGaps] = useState<Question[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [handover, setHandover] = useState<HandoverVersion | null>(null);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceUnit | null>(null);
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, type: "success" | "info" | "warning" | "error" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToast({ id, type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projData, statsData, claimsData, gapsData, timelineData] = await Promise.all([
        api.getProject().catch(() => null),
        api.getStats().catch(() => null),
        api.getClaims().catch(() => []),
        api.getGaps().catch(() => []),
        api.getTimeline().catch(() => []),
      ]);

      if (projData) setProject(projData);
      if (statsData) setStats(statsData);
      setClaims(claimsData || []);
      setGaps(gapsData || []);
      setTimeline(timelineData || []);

      // If claims exist and no claim selected, select the first one by default
      if (claimsData && claimsData.length > 0 && !selectedClaim) {
        setSelectedClaim(claimsData[0]);
        if (claimsData[0].supporting_evidence && claimsData[0].supporting_evidence.length > 0) {
          setSelectedEvidence(claimsData[0].supporting_evidence[0]);
        }
      }

      // Fetch handover snapshot if available
      try {
        const handoverData = await api.getHandover();
        setHandover(handoverData);
      } catch {
        setHandover(null);
      }

      // Fetch audit log
      try {
        const auditData = await api.getAudit();
        setAudit(auditData);
      } catch {
        setAudit([]);
      }
    } catch (err: any) {
      console.error("Failed to load handover data:", err);
      setError(err?.message || "Failed to load project data. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  }, [selectedClaim]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const switchUser = async (userId: string) => {
    const nextUser = USERS.find((u) => u.id === userId);
    if (!nextUser) return;
    setActiveUserId(userId);
    setCurrentUser(nextUser);
    showToast(`Switched view to ${nextUser.name} (${nextUser.role}, Clearance Level ${nextUser.clearance})`, "info");
    
    // Automatically re-fetch role-filtered data
    setLoading(true);
    try {
      const [projData, statsData, claimsData, gapsData, timelineData] = await Promise.all([
        api.getProject().catch(() => null),
        api.getStats().catch(() => null),
        api.getClaims().catch(() => []),
        api.getGaps().catch(() => []),
        api.getTimeline().catch(() => []),
      ]);
      if (projData) setProject(projData);
      if (statsData) setStats(statsData);
      setClaims(claimsData || []);
      setGaps(gapsData || []);
      setTimeline(timelineData || []);

      try {
        const handoverData = await api.getHandover();
        setHandover(handoverData);
      } catch {
        setHandover(null);
      }
    } catch (err: any) {
      setError(err?.message || "Error switching persona");
    } finally {
      setLoading(false);
    }
  };

  const openEvidenceDrawer = (claim: Claim, evidence?: EvidenceUnit) => {
    setSelectedClaim(claim);
    if (evidence) {
      setSelectedEvidence(evidence);
    } else if (claim.supporting_evidence && claim.supporting_evidence.length > 0) {
      setSelectedEvidence(claim.supporting_evidence[0]);
    } else {
      setSelectedEvidence(null);
    }
    setIsEvidenceDrawerOpen(true);
  };

  const closeEvidenceDrawer = () => {
    setIsEvidenceDrawerOpen(false);
  };

  const loadDemoProject = async () => {
    setLoading(true);
    try {
      const result = await api.loadDemo(true);
      showToast(`Loaded ${result.evidence_count} evidence units & ${result.claims_loaded} claims`, "success");
      await refreshData();
    } catch (err: any) {
      showToast(err.message || "Failed to load demo data", "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async (useCache = true) => {
    setLoading(true);
    try {
      const result = await api.extractClaims(useCache);
      showToast(
        `Extraction complete: ${result.verified_count} verified, ${result.conflicting_count} conflicting`,
        "success"
      );
      await refreshData();
      return result;
    } catch (err: any) {
      showToast(err.message || "Failed to run extraction", "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmClaim = async (id: string) => {
    if (currentUser.role !== "lead") {
      showToast("Only Maya Patel (Lead) can confirm claims", "warning");
      return;
    }
    try {
      const updated = await api.patchClaim(id, { review_state: "confirmed" });
      setClaims((prev) => prev.map((c) => (c.id === id ? updated : c)));
      if (selectedClaim?.id === id) {
        setSelectedClaim(updated);
      }
      showToast(`Claim confirmed: "${updated.text.substring(0, 40)}..."`, "success");
      // Update stats counts
      const updatedStats = await api.getStats().catch(() => null);
      if (updatedStats) setStats(updatedStats);
    } catch (err: any) {
      showToast(err.message || "Failed to confirm claim", "error");
    }
  };

  const rejectClaim = async (id: string) => {
    if (currentUser.role !== "lead") {
      showToast("Only Maya Patel (Lead) can reject claims", "warning");
      return;
    }
    try {
      const updated = await api.patchClaim(id, { review_state: "rejected" });
      setClaims((prev) => prev.map((c) => (c.id === id ? updated : c)));
      if (selectedClaim?.id === id) {
        setSelectedClaim(updated);
      }
      showToast("Claim marked as rejected", "info");
      const updatedStats = await api.getStats().catch(() => null);
      if (updatedStats) setStats(updatedStats);
    } catch (err: any) {
      showToast(err.message || "Failed to reject claim", "error");
    }
  };

  const editClaim = async (id: string, text: string, quote?: string, type?: ClaimType) => {
    if (currentUser.role !== "lead") {
      showToast("Only Maya Patel (Lead) can edit claims", "warning");
      return;
    }
    try {
      const updated = await api.patchClaim(id, {
        review_state: "edited",
        text,
        quote,
        type,
      });
      setClaims((prev) => prev.map((c) => (c.id === id ? updated : c)));
      if (selectedClaim?.id === id) {
        setSelectedClaim(updated);
      }
      showToast("Claim updated and marked edited", "success");
      const updatedStats = await api.getStats().catch(() => null);
      if (updatedStats) setStats(updatedStats);
    } catch (err: any) {
      showToast(err.message || "Failed to update claim", "error");
      throw err;
    }
  };

  const answerGap = async (id: string, answer: string) => {
    try {
      const answered = await api.answerGap(id, answer);
      setGaps((prev) => prev.map((g) => (g.id === id ? answered : g)));
      showToast("Answer recorded in handover log", "success");
      await refreshData();
    } catch (err: any) {
      showToast(err.message || "Failed to submit answer", "error");
      throw err;
    }
  };

  const approveHandover = async (notes: string) => {
    if (currentUser.role !== "lead") {
      showToast("Only Maya Patel (Lead) can approve the handover", "warning");
      return;
    }
    setLoading(true);
    try {
      const result = await api.approveHandover(notes);
      showToast(`Handover approved: version ${result.version} ratified`, "success");
      await refreshData();
    } catch (err: any) {
      showToast(err.message || "Approval failed", "error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeHandover = async (note = "") => {
    if (currentUser.role !== "successor") {
      showToast("Only Arjun Rao (Successor) can formally acknowledge receipt", "warning");
      return;
    }
    try {
      const versionId = handover?.version || "v1.0";
      await api.acknowledgeHandover(versionId, note);
      if (handover) {
        setHandover({ ...handover, acknowledged: true });
      }
      showToast("Handover formal receipt acknowledged", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to acknowledge receipt", "error");
      throw err;
    }
  };

  const askQuestion = async (question: string) => {
    return api.ask(question);
  };

  return (
    <HandoverContext.Provider
      value={{
        currentUser,
        switchUser,
        project,
        stats,
        claims,
        gaps,
        timeline,
        handover,
        audit,
        selectedClaim,
        selectedEvidence,
        isEvidenceDrawerOpen,
        openEvidenceDrawer,
        closeEvidenceDrawer,
        loading,
        error,
        toast,
        showToast,
        loadDemoProject,
        runAnalysis,
        confirmClaim,
        rejectClaim,
        editClaim,
        answerGap,
        approveHandover,
        acknowledgeHandover,
        askQuestion,
        refreshData,
      }}
    >
      {children}
    </HandoverContext.Provider>
  );
};

export const useHandover = () => {
  const context = useContext(HandoverContext);
  if (!context) {
    throw new Error("useHandover must be used within a HandoverProvider");
  }
  return context;
};
