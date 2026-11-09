import React from "react";
import { ExternalLink, FileText } from "lucide-react";
import { TimelineEvent } from "../types";
import { StatusBadge } from "./StatusBadge";

interface TimelineItemProps {
  event: TimelineEvent;
  onSelectSource?: (event: TimelineEvent) => void;
  className?: string;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  event,
  onSelectSource,
  className = "",
}) => {
  const status = event.status || "verified";
  const isConflict = status === "conflicting";
  const eventType = event.event_type || event.category || "Decision";

  return (
    <div className={`relative flex items-start gap-6 group ${className}`}>
      {/* Node Marker */}
      <div className="relative z-10 flex-shrink-0 w-10 flex justify-center pt-5">
        <div
          className={`w-4 h-4 rounded-full border-2 bg-white transition-colors flex items-center justify-center ${
            isConflict
              ? "border-[#E0AFA0] bg-[#E0AFA0]/20"
              : "border-[#BCB8B1] group-hover:border-[#463F3A]"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isConflict ? "bg-[#C9822B]" : "bg-[#5F7A61]"
            }`}
          ></div>
        </div>
      </div>

      {/* Event Card */}
      <div className="flex-1 bg-white border border-[#E7E4DE] rounded-2xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] hover:border-[#BCB8B1] transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-mono uppercase px-2 py-0.5 rounded bg-[#F4F3EE] border border-[#E7E4DE] text-[#463F3A]">
              {eventType}
            </span>
            <StatusBadge status={status} size="sm" />
          </div>
          <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
            {event.date}
          </span>
        </div>

        <h3 className="text-headline-section font-headline-section text-[#463F3A] mb-2 font-medium">
          {event.title}
        </h3>

        <p className="text-body-default font-body-default text-[#463F3A] mb-3 leading-relaxed">
          {event.summary}
        </p>

        {/* Inset Annotation / Provenance if conflict */}
        {isConflict && (
          <div className="bg-[#E0AFA0]/12 border-l-2 border-[#E0AFA0] rounded-r-lg px-3.5 py-2.5 mb-3 text-label-caption text-[#463F3A]">
            Needs clarification prior to credential handover sign-off.
          </div>
        )}

        {/* Footer & Source link */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E7E4DE] text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <FileText size={13} />
              {event.source_ref}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectSource && onSelectSource(event)}
            className="inline-flex items-center gap-1 text-[#463F3A] hover:underline transition-colors"
          >
            <span>View source link</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
