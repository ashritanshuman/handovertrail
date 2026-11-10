import React, { useState } from "react";
import { Check, ExternalLink } from "lucide-react";

interface OrientationTask {
  id: string;
  text: string;
  tag: string;
  category: string;
}

const DEFAULT_TASKS: OrientationTask[] = [
  {
    id: "task-1",
    text: "Rotate personal Apple Developer APNS certificate and transfer to dev-admin@campusconnect.org distribution list.",
    tag: "GAP-082",
    category: "DevOps",
  },
  {
    id: "task-2",
    text: "Verify Vault TTL lease setting (reconcile 90-day override in repo campus-infra/terraform/modules/vault before CAS v3 rollout).",
    tag: "Issue #42",
    category: "Sec-Auth",
  },
  {
    id: "task-3",
    text: "Execute dry-run deployment of Redis worker queue isolation under PR #142 orientation load test harness.",
    tag: "PR #142",
    category: "Backend",
  },
  {
    id: "task-4",
    text: "Inspect IAM role credentials migration for AWS S3 campusconnect-assets-prod bucket.",
    tag: "PR #114",
    category: "AWS-Infra",
  },
  {
    id: "task-5",
    text: "Shadow sprint sync with Maya Patel (Tech Lead) and test student union CAS 2.0 single sign-on endpoints.",
    tag: "Meeting notes",
    category: "Sprint 14",
  },
];

interface FirstSevenDaysCardProps {
  className?: string;
}

export const FirstSevenDaysCard: React.FC<FirstSevenDaysCardProps> = ({ className = "" }) => {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const toggleTask = (id: string) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(completed).filter(Boolean).length;

  return (
    <section
      className={`bg-white border border-[#d8d0c0] rounded-2xl p-6 md:p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)] ${className}`}
    >
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#d8d0c0]">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-md bg-[#F4F3EE] border border-[#d8d0c0] flex items-center justify-center text-label-mono-metadata font-label-mono-metadata text-[#241d18] font-semibold">
            01
          </span>
          <h2 className="text-headline-section font-headline-section text-[#241d18] font-semibold">
            First 7 days
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] font-medium">
            {completedCount} OF {DEFAULT_TASKS.length} COMPLETED
          </span>
          <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] font-medium hidden sm:inline">
            · CRITICAL ORIENTATION PATH
          </span>
        </div>
      </div>

      <ul className="space-y-4">
        {DEFAULT_TASKS.map((item) => {
          const isDone = !!completed[item.id];
          return (
            <li key={item.id} className="flex items-start gap-3.5 group">
              <button
                type="button"
                onClick={() => toggleTask(item.id)}
                aria-label={`Mark "${item.text}" as ${isDone ? "incomplete" : "done"}`}
                className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                  isDone
                    ? "bg-[#38523A] border-[#38523A] text-white"
                    : "border-[#d8d0c0] hover:border-[#241d18]"
                }`}
              >
                {isDone && <Check size={12} strokeWidth={2.5} />}
              </button>

              <div className="flex-1">
                <p
                  className={`text-body-default font-body-default leading-relaxed transition-all ${
                    isDone ? "line-through text-[#6B635E]" : "text-[#241d18] font-medium"
                  }`}
                >
                  {item.text}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-[#F4F3EE] text-[#241d18] border border-[#d8d0c0] font-medium">
                    {item.tag}
                    <ExternalLink size={12} className="text-[#6B635E]" />
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-[#F4F3EE] text-[#5C544F] border border-[#d8d0c0] font-medium">
                    {item.category}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

