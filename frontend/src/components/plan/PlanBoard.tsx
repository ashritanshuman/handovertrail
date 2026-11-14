import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PlanItem, PlanCategory, PlanPriority, PlanEffort } from "../../types";
import { PlanItemCard } from "./PlanItemCard";

interface PlanBoardProps {
  items: PlanItem[];
  isLead?: boolean;
  onToggleDone?: (id: string, current: boolean) => void;
  onMoveDay?: (id: string, newDay: number) => void;
  onUpdateItem?: (id: string, patch: Partial<PlanItem>) => void;
  onDeleteItem?: (id: string) => void;
  onSelectClaim?: (claimId: string) => void;
}

const DAY_THEMES: Record<number, { title: string; subtitle: string }> = {
  1: { title: "Orientation & Core Ownership", subtitle: "Pairing with departing engineer & initial setup" },
  2: { title: "Critical Risks & Triage", subtitle: "Immediate vulnerabilities & unreviewed ledgers" },
  3: { title: "Architectural Conflicts & Decisions", subtitle: "Unresolved specs & key policy alignments" },
  4: { title: "External Dependencies & APIs", subtitle: "Upstream services, APNs & webhook certs" },
  5: { title: "Partner Contacts & Stakeholders", subtitle: "Key liaisons & compliance introductions" },
  6: { title: "Architecture Reviews & Tests", subtitle: "Low-level codebase deep-dives & test harnesses" },
  7: { title: "Final Operational Verification", subtitle: "Handover sign-off & ongoing obligations" },
};

export const PlanBoard: React.FC<PlanBoardProps> = ({
  items,
  isLead = false,
  onToggleDone,
  onMoveDay,
  onUpdateItem,
  onDeleteItem,
  onSelectClaim,
}) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | "all">("all");
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editWhy, setEditWhy] = useState("");
  const [editCategory, setEditCategory] = useState<PlanCategory>("Understand");
  const [editPriority, setEditPriority] = useState<PlanPriority>("Medium");
  const [editEffort, setEditEffort] = useState<PlanEffort>("Medium");

  const startEdit = (item: PlanItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditWhy(item.why_it_matters);
    setEditCategory(item.category);
    setEditPriority(item.priority);
    setEditEffort(item.effort);
  };

  const saveEdit = () => {
    if (!editingItem || !onUpdateItem) return;
    onUpdateItem(editingItem.id, {
      title: editTitle,
      why_it_matters: editWhy,
      category: editCategory,
      priority: editPriority,
      effort: editEffort,
    });
    setEditingItem(null);
  };

  const days = [1, 2, 3, 4, 5, 6, 7];
  const itemsByDay: Record<number, PlanItem[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
  };

  items.forEach((item) => {
    const d = item.day >= 1 && item.day <= 7 ? item.day : 1;
    itemsByDay[d].push(item);
  });

  const completedCount = items.filter((it) => it.done).length;

  return (
    <div className="space-y-6">
      {/* Day Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#d8d0c0]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedDayFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedDayFilter === "all"
                ? "bg-[#2B2521] text-white shadow-xs"
                : "bg-white border border-[#d8d0c0] text-[#5C544F] hover:bg-[#F4F3EE]"
            }`}
          >
            All 7 Days ({items.length})
          </button>
          {days.map((dayNum) => {
            const count = itemsByDay[dayNum].length;
            const isSelected = selectedDayFilter === dayNum;
            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDayFilter(dayNum)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[#2B2521] text-white shadow-xs"
                    : "bg-white border border-[#d8d0c0] text-[#5C544F] hover:bg-[#F4F3EE]"
                }`}
              >
                Day {dayNum} ({count})
              </button>
            );
          })}
        </div>

        <div className="text-xs text-[#5C544F] font-mono flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-[#38523A]" />
          <span>
            {completedCount} of {items.length} completed
          </span>
        </div>
      </div>

      {/* Days Stack */}
      <div className="space-y-6">
        {days
          .filter((d) => selectedDayFilter === "all" || selectedDayFilter === d)
          .map((dayNum) => {
            const dayItems = itemsByDay[dayNum];
            const theme = DAY_THEMES[dayNum];
            return (
              <div
                key={dayNum}
                className="bg-[#FBFBFA] border border-[#d8d0c0] rounded-xl p-5 shadow-xs space-y-4"
              >
                {/* Day Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EBE8E0]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#2B2521] text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                      0{dayNum}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-[#241d18]">
                        Day {dayNum}: {theme.title}
                      </h3>
                      <p className="text-xs text-[#6B635E]">{theme.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-[#6B635E] bg-white px-2 py-0.5 rounded border border-[#d8d0c0]">
                    {dayItems.length} {dayItems.length === 1 ? "Action" : "Actions"}
                  </span>
                </div>

                {/* Day Items Grid */}
                {dayItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#8A817C] bg-white rounded-lg border border-dashed border-[#d8d0c0]">
                    No tasks assigned to Day {dayNum}. Move items from other days or regenerate.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {dayItems.map((item) => (
                      <PlanItemCard
                        key={item.id}
                        item={item}
                        isLead={isLead}
                        onToggleDone={onToggleDone}
                        onMoveDay={onMoveDay}
                        onEdit={startEdit}
                        onDelete={onDeleteItem}
                        onTogglePin={(id, cur) => onUpdateItem && onUpdateItem(id, { is_pinned: !cur })}
                        onSelectClaim={onSelectClaim}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Edit Modal Dialog */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in backdrop-blur-xs">
          <div className="bg-white border border-[#d8d0c0] rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-[#241d18]">
              Edit Plan Item ({editingItem.id})
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#413934] mb-1">Action Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#d8d0c0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2521]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#413934] mb-1">Why it matters (rationale)</label>
                <textarea
                  rows={2}
                  value={editWhy}
                  onChange={(e) => setEditWhy(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#d8d0c0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2521]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-[#413934] mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as PlanCategory)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#d8d0c0] bg-white text-xs"
                  >
                    <option value="Understand">Understand</option>
                    <option value="Fix">Fix</option>
                    <option value="Decide">Decide</option>
                    <option value="Contact">Contact</option>
                    <option value="Handover">Handover</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#413934] mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as PlanPriority)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#d8d0c0] bg-white text-xs"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#413934] mb-1">Effort</label>
                  <select
                    value={editEffort}
                    onChange={(e) => setEditEffort(e.target.value as PlanEffort)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#d8d0c0] bg-white text-xs"
                  >
                    <option value="Short">Short</option>
                    <option value="Medium">Medium</option>
                    <option value="Long">Long</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[#6B635E] italic">
                Citations ({editingItem.claim_ids.join(", ")}) remain permanently anchored to evidence.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EBE8E0]">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-lg border border-[#d8d0c0] text-xs font-medium text-[#5C544F] hover:bg-[#F4F3EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="px-4 py-2 rounded-lg bg-[#2B2521] text-white text-xs font-medium hover:bg-[#1f1a17]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
