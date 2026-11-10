import React from "react";
import { StatsResponse } from "../types";

interface ClaimsByTypeBarsProps {
  stats: StatsResponse | null;
  className?: string;
}

export const ClaimsByTypeBars: React.FC<ClaimsByTypeBarsProps> = ({ stats, className = "" }) => {
  const byType = stats?.by_type || {
    decision: 5,
    task: 3,
    risk: 2,
    dependency: 2,
    open_question: 1,
    contact: 1,
  };

  const total =
    Object.values(byType).reduce((acc, curr) => acc + curr, 0) || 14;

  const items = [
    { label: "Decisions", count: byType.decision || 0, primary: true },
    { label: "Tasks", count: byType.task || 0, primary: true },
    { label: "Risks", count: byType.risk || 0, primary: false },
    { label: "Dependencies", count: byType.dependency || 0, primary: false },
    { label: "Open questions", count: byType.open_question || 0, primary: false },
    { label: "Contacts", count: byType.contact || 0, primary: false },
  ];

  return (
    <article
      className={`bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-baseline justify-between pb-3 border-b border-[#d8d0c0]">
          <h2 className="text-headline-section font-headline-section text-[#241d18] font-semibold">Claims by type</h2>
          <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] font-medium">
            {total} categorized items
          </span>
        </div>

        <div className="space-y-4 pt-5">
          {items.map((item) => {
            const pct = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <div key={item.label}>
                <div className="flex justify-between items-center text-body-default font-body-default mb-1.5">
                  <span className="text-[#241d18] font-semibold">{item.label}</span>
                  <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E]">
                    {item.count} claims
                  </span>
                </div>
                <div className="w-full bg-[#F4F3EE] h-2 rounded-full overflow-hidden border border-[#d8d0c0]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.primary ? "bg-[#241d18]" : "bg-[#6B635E]"
                    }`}
                    style={{ width: `${Math.max(pct, item.count > 0 ? 5 : 0)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-[#d8d0c0] text-label-caption font-label-caption text-[#6B635E] flex items-center justify-between font-medium">
        <span>CampusConnect repository sync</span>
        <span className="font-mono text-xs text-[#241d18] px-1.5 py-0.5 rounded bg-[#F4F3EE] border border-[#d8d0c0]">rev-89e41b</span>
      </div>
    </article>
  );
};

