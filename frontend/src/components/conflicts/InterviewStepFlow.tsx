import React, { useState, useEffect } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, SkipForward, HelpCircle, MessageSquareQuote, Sparkles } from "lucide-react";
import { api } from "../../lib/api";
import { InterviewSession, InterviewQuestion } from "../../types";

interface InterviewStepFlowProps {
  onComplete?: () => void;
  onRefresh?: () => void;
}

export const InterviewStepFlow: React.FC<InterviewStepFlowProps> = ({ onComplete, onRefresh }) => {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getInterview();
      setSession(data);
      // Find first open question, or stay on 0
      const firstOpen = data.questions.findIndex((q) => q.state === "open");
      if (firstOpen !== -1) {
        setCurrentIndex(firstOpen);
        setCurrentAnswer(data.questions[firstOpen].answer || "");
      } else {
        setCurrentIndex(0);
        setCurrentAnswer(data.questions[0]?.answer || "");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load exit interview session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const currentQuestion: InterviewQuestion | undefined = session?.questions[currentIndex];

  useEffect(() => {
    if (currentQuestion) {
      setCurrentAnswer(currentQuestion.answer || "");
    }
  }, [currentIndex, currentQuestion]);

  const handleSaveAndNext = async () => {
    if (!currentQuestion || !currentAnswer.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.answerInterviewQuestion(currentQuestion.id, currentAnswer.trim());
      // Refresh session state
      const updated = await api.getInterview();
      setSession(updated);
      onRefresh?.();
      if (currentIndex < updated.questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onComplete?.();
      }
    } catch (err: any) {
      setError(err.message || "Failed to record answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!currentQuestion) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.skipInterviewQuestion(currentQuestion.id, "I don't recall");
      const updated = await api.getInterview();
      setSession(updated);
      onRefresh?.();
      if (currentIndex < updated.questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onComplete?.();
      }
    } catch (err: any) {
      setError(err.message || "Failed to skip question.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E0D8] rounded-xl p-10 text-center text-[#665E55]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8D3B2A] mb-3"></div>
        <p className="text-sm font-medium">Loading leaver exit-interview questions...</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
        <p className="font-semibold text-sm">Unable to load exit interview</p>
        <p className="text-xs mt-1">{error}</p>
        <button
          onClick={fetchSession}
          className="mt-3 px-3 py-1.5 bg-red-800 text-white text-xs font-medium rounded-lg hover:bg-red-900 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!session || session.questions.length === 0) {
    return (
      <div className="bg-white border border-[#E5E0D8] rounded-xl p-8 text-center text-[#665E55]">
        <HelpCircle className="h-10 w-10 text-[#A89F91] mx-auto mb-2" />
        <h3 className="font-serif text-lg font-bold text-[#241D18]">No Interview Questions</h3>
        <p className="text-sm mt-1">There are currently no open exit-interview questions for this project.</p>
      </div>
    );
  }

  const allCompleted = session.questions.every((q) => q.state === "answered" || q.state === "skipped");
  const progressPct = Math.round(((session.answered_count + session.skipped_count) / session.total_count) * 100);

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-sm overflow-hidden">
      {/* Header & Progress Bar */}
      <div className="border-b border-[#E5E0D8] bg-[#FAFAF8] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8D3B2A] bg-[#8D3B2A]/10 px-2.5 py-0.5 rounded-full">
                Leaver Exit Interview
              </span>
              <span className="text-xs text-[#665E55]">• {session.leaver_name} (Leaver)</span>
            </div>
            <h2 className="text-lg font-serif font-bold text-[#241D18] mt-1">
              Guided Knowledge Capture & Discrepancy Resolution
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-[#241D18]">
              {session.answered_count} answered, {session.skipped_count} skipped of {session.total_count} total
            </span>
            <div className="text-xs text-[#665E55]">{progressPct}% complete</div>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="w-full bg-[#E5E0D8] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#8D3B2A] h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Step dots navigation */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto py-1">
          {session.questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = q.state === "answered";
            const isSkipped = q.state === "skipped";

            let dotColor = "bg-[#E5E0D8] text-[#665E55]";
            if (isAnswered) dotColor = "bg-[#1E6B42] text-white";
            else if (isSkipped) dotColor = "bg-[#718096] text-white";
            else if (isCurrent) dotColor = "bg-[#8D3B2A] text-white ring-2 ring-[#8D3B2A]/30";

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${dotColor}`}
                title={`Question ${idx + 1}: ${q.text.slice(0, 40)}... (${q.state})`}
              >
                <span>Q{idx + 1}</span>
                {isAnswered && <CheckCircle2 className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Body */}
      {currentQuestion && (
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Question Metadata & Statement */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium bg-[#FAFAF8] border border-[#E5E0D8] text-[#665E55] px-2.5 py-0.5 rounded-full">
                {currentQuestion.topic || "Knowledge Gap"}
              </span>
              <span className="text-xs text-[#8D3B2A] font-semibold uppercase">
                {currentQuestion.kind === "conflict" ? "Contradiction to Clarify" : "Knowledge Gap"}
              </span>
              {currentQuestion.state === "answered" && (
                <span className="text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Answered
                </span>
              )}
              {currentQuestion.state === "skipped" && (
                <span className="text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full">
                  Skipped
                </span>
              )}
            </div>
            <h3 className="text-base font-serif font-bold text-[#241D18] leading-snug">
              {currentQuestion.text}
            </h3>
          </div>

          {/* Conflicting / Supporting Quotes Comparison */}
          {currentQuestion.quotes && currentQuestion.quotes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#665E55] uppercase tracking-wider flex items-center gap-1">
                <MessageSquareQuote className="h-3.5 w-3.5" /> Cited Evidence Quotes in Repository
              </p>
              <div className={`grid gap-3 ${currentQuestion.quotes.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                {currentQuestion.quotes.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="bg-[#FAFAF8] border border-[#E5E0D8] rounded-xl p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#665E55] mb-2 pb-1.5 border-b border-[#E5E0D8]">
                        <span className="font-semibold text-[#241D18]">{q.label}</span>
                        <span className="bg-white border border-[#E5E0D8] px-2 py-0.5 rounded text-[11px] font-mono">
                          {q.source_ref}
                        </span>
                      </div>
                      <blockquote className="text-xs text-[#241D18] italic font-serif leading-relaxed">
                        &ldquo;{q.quote}&rdquo;
                      </blockquote>
                    </div>
                    <div className="mt-3 text-[11px] text-[#8C827A] flex items-center justify-between">
                      <span>Author: {q.author}</span>
                      <span>{q.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick-Option Chips */}
          {currentQuestion.quick_options && currentQuestion.quick_options.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#665E55] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-[#8D3B2A]" /> Quick Answers (Click to select)
              </p>
              <div className="flex flex-wrap gap-2">
                {currentQuestion.quick_options.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => setCurrentAnswer(opt)}
                    className={`text-xs px-3 py-1.5 rounded-lg border text-left transition-all ${
                      currentAnswer === opt
                        ? "bg-[#8D3B2A] text-white border-[#8D3B2A] shadow-sm"
                        : "bg-white border-[#E5E0D8] text-[#241D18] hover:bg-[#FAFAF8] hover:border-[#8D3B2A]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Free-Text Answer Field */}
          <div className="space-y-2">
            <label htmlFor="leaver-answer-input" className="text-xs font-bold text-[#665E55] uppercase tracking-wider block">
              Your Answer / Additional Context for Successor
            </label>
            <textarea
              id="leaver-answer-input"
              rows={4}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Explain the actual production state, why this discrepancy exists, or provide pointers to configs, branches or runbooks..."
              className="w-full text-xs font-sans p-3 border border-[#E5E0D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8D3B2A] focus:border-transparent bg-white text-[#241D18]"
            />
            <p className="text-[11px] text-[#665E55]">
              Answers are automatically masked for secrets and stored as attributed exit-interview evidence (Clearance Level 2).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0 || submitting}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="px-3 py-2 text-xs font-medium text-[#665E55] bg-[#FAFAF8] hover:bg-[#E5E0D8] rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={handleSkip}
                className="px-3.5 py-2 text-xs font-medium text-[#665E55] hover:text-[#241D18] hover:bg-[#FAFAF8] rounded-lg border border-[#E5E0D8] transition-colors flex items-center gap-1.5"
                title="Mark as skipped if you do not recall the details"
              >
                <SkipForward className="h-3.5 w-3.5" />
                I don&apos;t recall (Skip)
              </button>

              <button
                type="button"
                disabled={!currentAnswer.trim() || submitting}
                onClick={handleSaveAndNext}
                className="px-5 py-2 text-xs font-bold text-white bg-[#8D3B2A] hover:bg-[#722F22] rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? "Saving..." : currentIndex === session.questions.length - 1 ? "Save & Finish" : "Save and Next"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Banner if all answered/skipped */}
      {allCompleted && (
        <div className="bg-[#E8F4EC] border-t border-emerald-200 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-[#1E6B42] font-semibold text-xs">
            <CheckCircle2 className="h-4 w-4" />
            <span>All exit-interview questions have been reviewed! Maya can now resolve conflict groups.</span>
          </div>
        </div>
      )}
    </div>
  );
};
