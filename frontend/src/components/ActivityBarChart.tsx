import React, { useState } from "react";
import { Search, Lock, Sparkles, CheckCircle2 } from "lucide-react";
import { useHandover } from "../context/HandoverContext";

interface ActivityBarChartProps {
  className?: string;
}

export const ActivityBarChart: React.FC<ActivityBarChartProps> = ({ className = "" }) => {
  const { project, handover, askQuestion } = useHandover();
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [askResult, setAskResult] = useState<{
    answer: string;
    citations: Array<{ source_ref: string; quote: string; access_level: number }>;
  } | null>(null);

  const isApproved = project?.handover_state === "approved" || handover !== null;

  const weeklyData = [
    { week: "W32", height: "32%", isPeak: false },
    { week: "W33", height: "40%", isPeak: false },
    { week: "W34", height: "48%", isPeak: false },
    { week: "W35", height: "42%", isPeak: false },
    { week: "W36", height: "58%", isPeak: false },
    { week: "W37", height: "52%", isPeak: false },
    { week: "W38", height: "68%", isPeak: false },
    { week: "W39", height: "94%", isPeak: true, label: "64 items (freeze)" },
    { week: "W40", height: "55%", isPeak: false },
    { week: "W41", height: "45%", isPeak: false },
    { week: "W42", height: "38%", isPeak: false },
  ];

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !isApproved) return;
    setAsking(true);
    try {
      const res = await askQuestion(query);
      setAskResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAsking(false);
    }
  };

  return (
    <article
      className={`bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-[#d8d0c0]">
          <div>
            <h2 className="text-headline-section font-headline-section text-[#241d18] font-semibold">
              Project activity
            </h2>
            <p className="text-body-default font-body-default text-[#5C544F] mt-0.5">
              Weekly ingested evidence items across Slack, GitHub PRs, and Notion RFCs
            </p>
          </div>
          <div className="flex items-center gap-3 text-label-mono-metadata font-label-mono-metadata text-[#6B635E] font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#d8d0c0]"></span> Normal ingest
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#8d3b2a]"></span> Freeze peak
            </span>
          </div>
        </div>

        {/* Minimal Weekly Bar Chart */}
        <div className="pt-8 pb-4">
          <div className="relative h-44 w-full flex items-end justify-between gap-2 px-2 sm:px-6">
            {/* Horizontal Guidelines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none">
              <div className="border-b border-[#d8d0c0] w-full flex justify-between">
                <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] -mt-2.5 bg-white pr-1">
                  60 items
                </span>
              </div>
              <div className="border-b border-[#d8d0c0] w-full flex justify-between">
                <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] -mt-2.5 bg-white pr-1">
                  40 items
                </span>
              </div>
              <div className="border-b border-[#d8d0c0] w-full flex justify-between">
                <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] -mt-2.5 bg-white pr-1">
                  20 items
                </span>
              </div>
              <div className="border-b border-[#d8d0c0] w-full flex justify-between">
                <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] -mt-2.5 bg-white pr-1">
                  0
                </span>
              </div>
            </div>

            {/* Bars W32 to W42 */}
            {weeklyData.map((d) => (
              <div
                key={d.week}
                className="relative z-10 flex-1 flex flex-col items-center group h-full justify-end"
              >
                {d.isPeak && (
                  <div className="absolute -top-7 px-2 py-0.5 rounded bg-[#241d18] text-white text-xs font-mono whitespace-nowrap shadow-sm font-semibold">
                    {d.label}
                  </div>
                )}
                <div
                  className={`w-full max-w-[28px] rounded-t-sm transition-colors ${
                    d.isPeak
                      ? "bg-[#8d3b2a] ring-1 ring-[#8d3b2a]"
                      : "bg-[#d8d0c0] group-hover:bg-[#6B635E]"
                  }`}
                  style={{ height: d.height }}
                ></div>
                <span
                  className={`mt-2 text-label-mono-metadata font-label-mono-metadata ${
                    d.isPeak ? "text-[#241d18] font-bold" : "text-[#6B635E]"
                  }`}
                >
                  {d.week}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quiet Query Row */}
      <div className="mt-6 pt-5 border-t border-[#d8d0c0]">
        <form onSubmit={handleAsk}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-grow">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B635E]"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={!isApproved}
                placeholder={
                  isApproved
                    ? "Ask the approved handover (e.g., 'Why SQLite?' or 'Key rotation')..."
                    : "Ask the approved handover..."
                }
                className={`w-full h-10 pl-10 pr-4 rounded-[10px] border border-[#d8d0c0] text-body-default font-body-default text-[#241d18] transition-colors ${
                  isApproved
                    ? "bg-white focus:border-[#241d18] focus:outline-none"
                    : "bg-[#F4F3EE] cursor-not-allowed placeholder:text-[#6B635E]"
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={!isApproved || asking || !query.trim()}
              className={`h-10 px-5 rounded-[10px] text-body-medium font-body-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2 ${
                isApproved && query.trim()
                  ? "bg-[#2B2521] text-white hover:bg-[#1f1a17]"
                  : "bg-[#6B635E] text-[#F4F3EE] cursor-not-allowed"
              }`}
            >
              {asking ? "Checking..." : "Ask"}
            </button>
          </div>
        </form>

        {!isApproved ? (
          <p className="text-label-caption font-label-caption text-[#6B635E] mt-2 flex items-center gap-1.5 font-medium">
            <Lock size={14} />
            <span>Available after approval</span>
          </p>
        ) : (
          <p className="text-label-caption font-label-caption text-[#38523A] mt-2 flex items-center gap-1.5 font-medium">
            <Sparkles size={14} />
            <span>Handover approved — answers verified against permitted sources only</span>
          </p>
        )}

        {/* Answer Citation Box */}
        {askResult && (
          <div className="mt-4 p-4 rounded-xl bg-[#F4F3EE] border border-[#d8d0c0] animate-fade-in">
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle2 size={16} className="text-[#38523A] mt-0.5 shrink-0" />
              <p className="text-body-default text-[#241d18] font-semibold leading-relaxed">
                {askResult.answer}
              </p>
            </div>
            {askResult.citations && askResult.citations.length > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-[#d8d0c0] text-label-mono-metadata text-[#5C544F] space-y-1">
                <span className="uppercase tracking-wider font-semibold text-[#241d18]">Verified source citation:</span>
                {askResult.citations.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-[#241d18] font-semibold">{c.source_ref}</span>
                    <span>·</span>
                    <span className="italic text-[#5C544F]">"{c.quote}"</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

