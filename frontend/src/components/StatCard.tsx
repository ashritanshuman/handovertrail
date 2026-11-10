import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  className = "",
}) => {
  return (
    <article
      className={`bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] uppercase tracking-wider font-semibold">
          {title}
        </span>
        {icon && <div className="text-[#6B635E]">{icon}</div>}
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-display-stat font-display-stat text-[#241d18] leading-tight font-medium">
            {value}
          </span>
          {badge}
        </div>
        {subtitle && (
          <p className="text-body-default font-body-default text-[#5C544F] mt-1 text-sm font-normal">
            {subtitle}
          </p>
        )}
      </div>
    </article>
  );
};

