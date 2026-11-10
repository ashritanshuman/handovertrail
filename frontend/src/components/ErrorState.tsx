import React from "react";
import { AlertCircle, RotateCw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`bg-white border border-[#BA1A1A]/20 rounded-2xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-[#BA1A1A]/10 text-[#BA1A1A] flex items-center justify-center mb-3">
        <AlertCircle size={20} strokeWidth={1.75} />
      </div>
      <h3 className="text-headline-section font-headline-section text-[#241d18] font-medium mb-1">
        Unable to load data
      </h3>
      <p className="text-body-default font-body-default text-[#5C544F] max-w-sm mb-4 text-base">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#2B2521] hover:bg-[#1f1a17] text-white text-body-medium font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B2521] focus:ring-offset-2"
        >
          <RotateCw size={14} />
          <span>Retry connection</span>
        </button>
      )}
    </div>
  );
};

