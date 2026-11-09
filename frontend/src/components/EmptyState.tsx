import React from "react";
import { FolderSearch } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`bg-white border border-[#E7E4DE] rounded-2xl p-8 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#F4F3EE] flex items-center justify-center text-[#8A817C] mb-3">
        <FolderSearch size={22} strokeWidth={1.5} />
      </div>
      <h3 className="text-headline-section font-headline-section text-[#463F3A] font-medium mb-1">
        {title}
      </h3>
      <p className="text-body-default font-body-default text-[#8A817C] max-w-sm mb-4 leading-relaxed text-[13px]">
        {description}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 rounded-[10px] bg-[#463F3A] hover:bg-[#37312D] text-white text-body-medium font-medium transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

