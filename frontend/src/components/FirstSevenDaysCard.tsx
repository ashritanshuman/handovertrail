import React, { useState, useEffect } from "react";
import { Check, ExternalLink, Clock } from "lucide-react";
import { PlanResponse, PlanCategory } from "../types";
import { api } from "../lib/api";
import { useHandover } from "../context/HandoverContext";

interface FirstSevenDaysCardProps {
  className?: string;
  plan?: PlanResponse | null;
  onSelectClaim?: (claimId: string) => void;
}

const CATEGORY_STYLES: Record<PlanCategory, { label: string; text: string; bg: string; border: string }> = {
  Understand: { label: "Understand", text: "text-[#2B3E50]", bg: "bg-[#F0F4F8]", border: "border-[#C8D6E5]" },
  Fix: { label: "Fix", text: "text-[#8F5105]", bg: "bg-[#FEF7ED]", border: "border-[#FCD34D]" },
  Decide: { label: "Decide", text: "text-[#5B4278]", bg: "bg-[#F6F2FA]", border: "border-[#DDD0ED]" },
  Contact: { label: "Contact", text: "text-[#2A5954]", bg: "bg-[#EDF7F6]", border: "border-[#B8E2DE]" },
  Handover: { label: "Handover", text: "text-[#38523A]", bg: "bg-[#EEF6EF]", border: "border-[#B5D8B8]" },
};

export const FirstSevenDaysCard: React.FC<FirstSevenDaysCardProps> = ({
  className = "",
  plan: propPlan,
  onSelectClaim,
}) => {
  const { handover, showToast } = useHandover();
  const [activePlan, setActivePlan] = useState<PlanResponse | null>(propPlan || handover?.plan || null);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (propPlan) {
      setActivePlan(propPlan);
      const initMap: Record<string, boolean> = {};
      propPlan.items.forEach((it) => {
        initMap[it.id] = Boolean(it.done);
      });
      setCompletedMap(initMap);
    } else if (handover?.plan) {
      setActivePlan(handover.plan);
      const initMap: Record<string, boolean> = {};
      handover.plan.items.forEach((it) => {
        initMap[it.id] = Boolean(it.done);
      });
      setCompletedMap(initMap);
    } else {
      // Attempt fetching published plan for successor
      api.getPlan()
        .then((p) => {
          setActivePlan(p);
          const initMap: Record<string, boolean> = {};
          p.items.forEach((it) => {
            initMap[it.id] = Boolean(it.done);
          });
          setCompletedMap(initMap);
        })
        .catch(() => {
          // No published plan yet, gracefully falls back
        });
    }
  }, [propPlan, handover]);

  const toggleTask = async (itemId: string) => {
    const nextDone = !completedMap[itemId];
    // Optimistic UI update
    setCompletedMap((prev) => ({ ...prev, [itemId]: nextDone }));

    try {
      await api.togglePlanProgress(itemId, nextDone);
      if (showToast) {
        showToast(nextDone ? "Item marked as done" : "Item marked as incomplete", "info");
      }
    } catch (err: any) {
      // Revert on error
      setCompletedMap((prev) => ({ ...prev, [itemId]: !nextDone }));
      if (showToast) {
        showToast(err.message || "Failed to save progress", "error");
      }
    }
  };

  const planItems = activePlan?.items || [];
  const totalTasks = planItems.length;
  const completedCount = Object.values(completedMap).filter(Boolean).length;

  return (
    <section
      className={`bg-white border border-[#d8d0c0] rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)] ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between pb-4 mb-5 border-b border-[#d8d0c0] gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-md bg-[#F4F3EE] border border-[#d8d0c0] flex items-center justify-center text-label-mono-metadata font-label-mono-metadata text-[#241d18] font-semibold">
            01
          </span>
          <div>
            <h2 className="text-headline-section font-headline-section text-[#241d18] font-semibold">
              First 7 Days Action Plan
            </h2>
            {activePlan?.role_title && (
              <p className="text-xs font-mono text-[#6B635E]">
                Plan for Arjun Rao, {activePlan.role_title}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] font-medium">
            {completedCount} OF {totalTasks} COMPLETED
          </span>
          <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] font-medium hidden sm:inline">
            · RATIFIED ONBOARDING PATH
          </span>
        </div>
      </div>

      {planItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#8A817C] bg-[#FDFCF7] rounded-xl border border-dashed border-[#d8d0c0]">
          The lead has not yet published an approved 7-day onboarding plan.
        </div>
      ) : (
        <ul className="space-y-4">
          {planItems.map((item) => {
            const isDone = Boolean(completedMap[item.id]);
            const cat = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.Understand;

            return (
              <li
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isDone
                    ? "bg-[#F9F8F5] border-[#d8d0c0] opacity-80"
                    : "bg-white border-[#d8d0c0] hover:border-[#b8b0a2]"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => toggleTask(item.id)}
                    aria-label={`Mark "${item.title}" as ${isDone ? "incomplete" : "done"}`}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      isDone
                        ? "bg-[#38523A] border-[#38523A] text-white"
                        : "border-[#d8d0c0] hover:border-[#241d18] bg-white"
                    }`}
                  >
                    {isDone && <Check size={12} strokeWidth={3} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#2B2521] text-white">
                        Day {item.day}
                      </span>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cat.bg} ${cat.text} ${cat.border}`}
                      >
                        {cat.label}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6B635E] bg-[#F4F3EE] px-2 py-0.5 rounded border border-[#d8d0c0]">
                        <Clock size={11} />
                        <span>{item.effort} Effort</span>
                      </span>
                    </div>

                    <p
                      className={`text-body-default font-medium leading-relaxed ${
                        isDone ? "line-through text-[#8A817C]" : "text-[#241d18]"
                      }`}
                    >
                      {item.title}
                    </p>

                    {item.why_it_matters && (
                      <p className="text-xs text-[#5C544F] mt-1 leading-relaxed">
                        <strong className="font-semibold text-[#413934]">Why it matters:</strong>{" "}
                        {item.why_it_matters}
                      </p>
                    )}

                    {/* Citations */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] text-[#6B635E] font-medium mr-1">Citations:</span>
                      {item.claim_ids.map((cid) => (
                        <button
                          key={cid}
                          type="button"
                          onClick={() => onSelectClaim && onSelectClaim(cid)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F4F3EE] hover:bg-[#EBE8E0] border border-[#d8d0c0] text-[11px] font-mono text-[#241d18] transition-colors"
                        >
                          <span>{item.source_label || cid}</span>
                          <ExternalLink size={10} className="text-[#6B635E]" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
