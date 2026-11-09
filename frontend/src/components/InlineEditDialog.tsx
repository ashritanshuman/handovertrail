import React, { useState } from "react";
import { Edit2, X } from "lucide-react";
import { Claim, ClaimType } from "../types";

interface InlineEditDialogProps {
  claim: Claim | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, text: string, quote?: string, type?: ClaimType) => Promise<void>;
}

export const InlineEditDialog: React.FC<InlineEditDialogProps> = ({
  claim,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !claim) return null;

  const [text, setText] = useState(claim.text);
  const [quote, setQuote] = useState(claim.quote || "");
  const [type, setType] = useState<ClaimType>(claim.type);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onSave(claim.id, text, quote, type);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#E7E4DE] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E4DE]">
          <div className="flex items-center gap-2">
            <Edit2 size={18} className="text-[#463F3A]" />
            <h3 className="text-headline-section font-headline-section text-[#463F3A] font-semibold">
              Edit Claim Details
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#8A817C] hover:text-[#463F3A]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-label-caption font-label-caption text-[#463F3A] font-medium mb-1.5">
              Claim Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ClaimType)}
              className="w-full rounded-[10px] border border-[#BCB8B1] p-2.5 text-body-default font-body-default text-[#463F3A] bg-white focus:border-[#463F3A] focus:outline-none"
            >
              <option value="decision">Decision</option>
              <option value="task">Task</option>
              <option value="risk">Risk</option>
              <option value="dependency">Dependency</option>
              <option value="open_question">Open question</option>
              <option value="contact">Contact</option>
            </select>
          </div>

          <div>
            <label className="block text-label-caption font-label-caption text-[#463F3A] font-medium mb-1.5">
              Claim Statement Text
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-[10px] border border-[#BCB8B1] p-3 text-body-default font-body-default text-[#463F3A] focus:border-[#463F3A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-label-caption font-label-caption text-[#463F3A] font-medium mb-1.5">
              Exact Supporting Quote
            </label>
            <input
              type="text"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="w-full rounded-[10px] border border-[#BCB8B1] p-2.5 text-body-default font-body-default text-[#463F3A] focus:border-[#463F3A] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E4DE]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] border border-[#BCB8B1] text-[#463F3A] text-body-medium font-medium hover:bg-[#F4F3EE] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-[10px] bg-[#463F3A] hover:bg-[#37312D] text-white text-body-medium font-medium transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

