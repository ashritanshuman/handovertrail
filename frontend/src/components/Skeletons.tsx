import React from "react";

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`bg-white border border-[#E7E4DE] rounded-xl p-5 shadow-[0_1px_2px_rgba(70,63,58,0.06)] animate-pulse space-y-3 ${className}`}
  >
    <div className="flex justify-between items-center">
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-[#F4F3EE] rounded-full"></div>
        <div className="h-5 w-24 bg-[#F4F3EE] rounded-full"></div>
      </div>
      <div className="h-5 w-20 bg-[#F4F3EE] rounded-full"></div>
    </div>
    <div className="h-4 bg-[#F4F3EE] rounded w-3/4"></div>
    <div className="h-4 bg-[#F4F3EE] rounded w-1/2"></div>
    <div className="pt-2 border-t border-[#E7E4DE]/60 flex justify-between">
      <div className="h-3 w-20 bg-[#F4F3EE] rounded"></div>
      <div className="h-6 w-16 bg-[#F4F3EE] rounded"></div>
    </div>
  </div>
);

export const BentoSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`bg-white border border-[#E7E4DE] rounded-2xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] animate-pulse space-y-4 ${className}`}
  >
    <div className="h-5 bg-[#F4F3EE] rounded w-1/3"></div>
    <div className="h-4 bg-[#F4F3EE] rounded w-1/2"></div>
    <div className="h-32 bg-[#F4F3EE] rounded-xl"></div>
    <div className="h-4 bg-[#F4F3EE] rounded w-2/3"></div>
  </div>
);

