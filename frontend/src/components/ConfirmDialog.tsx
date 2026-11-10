import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  unreviewedCount: number;
  conflictingCount: number;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  unreviewedCount,
  conflictingCount,
}) => {
  const [notes, setNotes] = useState("Handover ratified by Maya Patel for CampusConnect Q4 release.");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const hasWarnings = unreviewedCount > 0 || conflictingCount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(notes);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#d8d0c0] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-[#d8d0c0]">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#38523A]" />
            <h3 className="text-headline-section font-headline-section text-[#241d18] font-semibold">
              Approve Handover Brief
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#6B635E] hover:text-[#241d18]"
          >
            <X size={18} />
          </button>
        </div>

        {hasWarnings && (
          <div className="my-4 p-3.5 rounded-xl bg-[#C9822B]/12 border border-[#C9822B]/35 flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-[#8F5105] shrink-0 mt-0.5" />
            <div className="text-sm text-[#241d18] leading-relaxed">
              <strong className="block text-[#8F5105] font-semibold">
                Unresolved items remain
              </strong>
              You have {unreviewedCount} unreviewed claims and {conflictingCount} active conflicting gaps.
              Approving now creates an immutable snapshot accessible to the successor (Arjun Rao).
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-label-caption font-label-caption text-[#241d18] font-medium mb-1.5">
              Approval Ratification Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-[10px] border border-[#d8d0c0] p-3 text-body-default font-body-default text-[#241d18] focus:border-[#241d18] focus:outline-none"
              placeholder="Add sign-off notes or transition stipulations..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#d8d0c0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] border border-[#d8d0c0] text-[#241d18] text-body-medium font-medium hover:bg-[#F4F3EE] transition-colors focus:outline-none focus:ring-2 focus:ring-[#241d18]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-[10px] bg-[#2B2521] hover:bg-[#1f1a17] text-white text-body-medium font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2 disabled:bg-[#6B635E] disabled:cursor-not-allowed"
            >
              {submitting ? "Ratifying..." : "Confirm & Approve"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

