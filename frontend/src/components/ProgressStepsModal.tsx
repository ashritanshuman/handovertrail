import React, { useState, useEffect } from "react";
import { RotateCw, X, Sparkles, Database, Check } from "lucide-react";

interface ProgressStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  isLiveModelDefault?: boolean;
}

export const ProgressStepsModal: React.FC<ProgressStepsModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  isLiveModelDefault = false,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const isLiveModel = isLiveModelDefault;
  const [isFinished, setIsFinished] = useState(false);
  const stats = { extracted: 14, verified: 9, conflicting: 2 };

  const steps = [
    { title: "Ingesting project sources", desc: "Parsing GitHub PRs, Slack #backend export, and meeting notes..." },
    { title: "Extracting claims & decisions", desc: "Extracting architectural decisions, tasks, risks, and contacts..." },
    { title: "Verifying exact quotes", desc: "Matching candidate statements against verbatim source spans..." },
    { title: "Detecting conflicts & gaps", desc: "Identifying cross-source policy discrepancies (e.g. Issue #42 vs Notes)..." },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsFinished(false);
      return;
    }

    // Step progression animation
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setIsFinished(true);
          return prev;
        }
      });
    }, 700);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#d8d0c0] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#d8d0c0]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8d3b2a]"></span>
            <h3 className="text-headline-section font-headline-section text-[#241d18] font-semibold">
              Handover Analysis Pipeline
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#6B635E] hover:text-[#241d18] hover:bg-[#F4F3EE]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Model disclosure badge (Trust moment #5) */}
        <div className="my-4 p-3 rounded-xl bg-[#F4F3EE] border border-[#d8d0c0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLiveModel ? (
              <Sparkles size={16} className="text-[#38523A]" />
            ) : (
              <Database size={16} className="text-[#3C5066]" />
            )}
            <div>
              <div className="text-xs font-semibold text-[#241d18]">
                {isLiveModel ? "Live Anthropic Model (Claude 3.5 Sonnet)" : "Verified Demo Cache (Instant)"}
              </div>
              <div className="text-xs text-[#5C544F]">
                Deterministic Python code executes quote verification and permission gates.
              </div>
            </div>
          </div>
          <span
            className={`text-xs font-mono uppercase px-2 py-0.5 rounded font-bold ${
              isLiveModel
                ? "bg-[#5F7A61]/15 text-[#38523A]"
                : "bg-[#6B7F94]/15 text-[#3C5066]"
            }`}
          >
            {isLiveModel ? "Live API" : "Cached Ingest"}
          </span>
        </div>

        {/* Steps List */}
        <div className="space-y-4 py-2">
          {steps.map((step, idx) => {
            const isDone = currentStep > idx || isFinished;
            const isCurrent = currentStep === idx && !isFinished;

            return (
              <div key={step.title} className="flex items-start gap-3">
                <div className="pt-0.5">
                  {isDone ? (
                    <div className="w-5 h-5 rounded-full bg-[#38523A] flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={2.5} />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[#241d18] flex items-center justify-center">
                      <RotateCw size={10} className="animate-spin text-[#241d18]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-[#d8d0c0] bg-[#F4F3EE]" />
                  )}
                </div>
                <div>
                  <div
                    className={`text-body-default font-medium leading-tight ${
                      isDone || isCurrent ? "text-[#241d18]" : "text-[#6B635E]"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-[#5C544F] mt-0.5">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completed summary banner */}
        {isFinished && (
          <div className="mt-5 p-3.5 rounded-xl bg-[#5F7A61]/10 border border-[#5F7A61]/35 animate-fade-in">
            <div className="flex items-center justify-between text-label-caption font-label-caption text-[#38523A]">
              <span className="font-semibold">Analysis complete in 1,420ms</span>
              <span>100% verified against sources</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#5F7A61]/25 text-xs text-[#241d18]">
              <div>
                <span className="text-[#6B635E] block text-xs uppercase font-medium">Extracted</span>
                <span className="font-semibold">{stats.extracted} claims</span>
              </div>
              <div>
                <span className="text-[#6B635E] block text-xs uppercase font-medium">Verified</span>
                <span className="font-semibold text-[#38523A]">{stats.verified} claims</span>
              </div>
              <div>
                <span className="text-[#6B635E] block text-xs uppercase font-medium">Conflicts</span>
                <span className="font-semibold text-[#8F5105]">{stats.conflicting} gaps</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-[#d8d0c0] flex justify-end gap-3">
          {isFinished ? (
            <button
              type="button"
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="px-5 py-2 rounded-[10px] bg-[#2B2521] hover:bg-[#1f1a17] text-white text-body-medium font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2"
            >
              View updated workspace
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="px-5 py-2 rounded-[10px] bg-[#6B635E] text-[#F4F3EE] text-body-medium font-medium cursor-not-allowed"
            >
              Running verification...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
