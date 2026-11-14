import React from "react";
import {
  Check,
  Pin,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit2,
  Trash2,
  AlertCircle,
  Users,
  Wrench,
  BookOpen,
  Clock,
} from "lucide-react";
import { PlanItem, PlanCategory, PlanPriority } from "../../types";

interface PlanItemCardProps {
  item: PlanItem;
  isLead?: boolean;
  onToggleDone?: (id: string, current: boolean) => void;
  onMoveDay?: (id: string, newDay: number) => void;
  onEdit?: (item: PlanItem) => void;
  onDelete?: (id: string) => void;
  onTogglePin?: (id: string, currentPinned: boolean) => void;
  onSelectClaim?: (claimId: string) => void;
}

const CATEGORY_CONFIG: Record<
  PlanCategory,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  Understand: {
    label: "Understand",
    bg: "bg-[#F0F4F8]",
    text: "text-[#2B3E50]",
    border: "border-[#C8D6E5]",
    icon: <BookOpen size={12} />,
  },
  Fix: {
    label: "Fix",
    bg: "bg-[#FEF7ED]",
    text: "text-[#8F5105]",
    border: "border-[#FCD34D]",
    icon: <Wrench size={12} />,
  },
  Decide: {
    label: "Decide",
    bg: "bg-[#F6F2FA]",
    text: "text-[#5B4278]",
    border: "border-[#DDD0ED]",
    icon: <AlertCircle size={12} />,
  },
  Contact: {
    label: "Contact",
    bg: "bg-[#EDF7F6]",
    text: "text-[#2A5954]",
    border: "border-[#B8E2DE]",
    icon: <Users size={12} />,
  },
  Handover: {
    label: "Handover",
    bg: "bg-[#EEF6EF]",
    text: "text-[#38523A]",
    border: "border-[#B5D8B8]",
    icon: <Check size={12} />,
  },
};

const PRIORITY_CONFIG: Record<
  PlanPriority,
  { label: string; text: string; dot: string }
> = {
  High: { label: "High", text: "text-[#BA1A1A]", dot: "bg-[#BA1A1A]" },
  Medium: { label: "Medium", text: "text-[#8F5105]", dot: "bg-[#8F5105]" },
  Low: { label: "Low", text: "text-[#5C544F]", dot: "bg-[#8A817C]" },
};

export const PlanItemCard: React.FC<PlanItemCardProps> = ({
  item,
  isLead = false,
  onToggleDone,
  onMoveDay,
  onEdit,
  onDelete,
  onTogglePin,
  onSelectClaim,
}) => {
  const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Understand;
  const prio = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.Medium;
  const isDone = Boolean(item.done);

  return (
    <div
      className={`relative rounded-xl border transition-all duration-150 p-4 ${
        item.is_pinned
          ? "bg-[#FDFCF7] border-[#E0AFA0] shadow-[0_2px_8px_rgba(224,175,160,0.25)]"
          : isDone
          ? "bg-[#F9F8F5] border-[#d8d0c0] opacity-80"
          : "bg-white border-[#d8d0c0] shadow-[0_1px_2px_rgba(70,63,58,0.06)] hover:border-[#b8b0a2]"
      }`}
    >
      {/* Pinned pill if active */}
      {item.is_pinned && (
        <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-[#E0AFA0] text-white text-[10px] font-semibold flex items-center gap-1 shadow-xs tracking-wide uppercase">
          <Pin size={10} className="fill-white" />
          <span>Pinned by Lead</span>
        </div>
      )}

      {/* Header tags: Category + Priority + Effort */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {/* Category Chip */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${cat.bg} ${cat.text} ${cat.border}`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </span>

          {/* Priority indicator (icon + text) */}
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${prio.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
            <span>{prio.label} Priority</span>
          </span>
        </div>

        {/* Effort Label */}
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6B635E] bg-[#F4F3EE] px-2 py-0.5 rounded border border-[#d8d0c0]">
          <Clock size={11} />
          <span>{item.effort} Effort</span>
        </span>
      </div>

      {/* Title & Checkbox */}
      <div className="flex items-start gap-3">
        {onToggleDone && (
          <button
            type="button"
            onClick={() => onToggleDone(item.id, isDone)}
            aria-label={`Mark "${item.title}" as ${isDone ? "incomplete" : "done"}`}
            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
              isDone
                ? "bg-[#38523A] border-[#38523A] text-white"
                : "border-[#d8d0c0] hover:border-[#241d18] bg-white"
            }`}
          >
            {isDone && <Check size={13} strokeWidth={3} />}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h4
            className={`text-body-medium font-medium leading-snug ${
              isDone ? "line-through text-[#8A817C]" : "text-[#241d18]"
            }`}
          >
            {item.title}
          </h4>

          {item.why_it_matters && (
            <p className="text-body-default text-[#5C544F] text-xs leading-relaxed mt-1">
              <strong className="font-semibold text-[#413934]">Why it matters:</strong>{" "}
              {item.why_it_matters}
            </p>
          )}

          {/* Citations & Evidence Refs */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] text-[#6B635E] font-medium mr-1">Cited Claims:</span>
            {item.claim_ids.map((cid) => (
              <button
                key={cid}
                type="button"
                onClick={() => onSelectClaim && onSelectClaim(cid)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F4F3EE] hover:bg-[#EBE8E0] border border-[#d8d0c0] text-[11px] font-mono text-[#241d18] transition-colors"
                title={`View supporting claim ${cid}`}
              >
                <span>{item.source_label || cid}</span>
                <ExternalLink size={10} className="text-[#6B635E]" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lead Management Action Toolbar */}
      {isLead && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#EBE8E0] text-xs text-[#5C544F]">
          <div className="flex items-center gap-1">
            <span className="text-[#6B635E] mr-1">Move:</span>
            <button
              type="button"
              disabled={item.day <= 1}
              onClick={() => onMoveDay && onMoveDay(item.id, item.day - 1)}
              className="px-1.5 py-0.5 rounded border border-[#d8d0c0] hover:bg-[#F4F3EE] disabled:opacity-30 disabled:pointer-events-none"
              title="Move to previous day"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="font-mono font-medium px-1">Day {item.day}</span>
            <button
              type="button"
              disabled={item.day >= 7}
              onClick={() => onMoveDay && onMoveDay(item.id, item.day + 1)}
              className="px-1.5 py-0.5 rounded border border-[#d8d0c0] hover:bg-[#F4F3EE] disabled:opacity-30 disabled:pointer-events-none"
              title="Move to next day"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(item.id, Boolean(item.is_pinned))}
                className={`px-2 py-1 rounded text-xs border transition-colors inline-flex items-center gap-1 ${
                  item.is_pinned
                    ? "bg-[#E0AFA0]/20 text-[#8d3b2a] border-[#E0AFA0]"
                    : "border-[#d8d0c0] hover:bg-[#F4F3EE] text-[#5C544F]"
                }`}
              >
                <Pin size={11} />
                <span>{item.is_pinned ? "Unpin" : "Pin"}</span>
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="p-1 rounded border border-[#d8d0c0] hover:bg-[#F4F3EE] text-[#5C544F]"
                title="Edit item title or rationale"
              >
                <Edit2 size={12} />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="p-1 rounded border border-[#d8d0c0] hover:bg-[#FEF2F2] hover:text-[#BA1A1A] text-[#8A817C]"
                title="Remove item from plan"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
