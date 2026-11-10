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
              ? "border-[#8d3b2a] bg-[#8d3b2a]/15"
              : "border-[#d8d0c0] group-hover:border-[#241d18]"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isConflict ? "bg-[#8F5105]" : "bg-[#38523A]"
            }`}
          ></div>
        </div>
      </div>

      {/* Event Card */}
      <div className="flex-1 bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-[0_1px_2px_rgba(70,63,58,0.06)] hover:border-[#6B635E] transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#F4F3EE] border border-[#d8d0c0] text-[#241d18] font-medium">
              {eventType}
            </span>
            <StatusBadge status={status} size="sm" />
          </div>
          <span className="text-label-mono-metadata font-label-mono-metadata text-[#6B635E] font-medium">
            {event.date}
          </span>
        </div>

        <h3 className="text-headline-section font-headline-section text-[#241d18] mb-2 font-medium">
          {event.title}
        </h3>

        <p className="text-body-default font-body-default text-[#5C544F] mb-3 leading-relaxed">
          {event.summary}
        </p>

        {/* Inset Annotation / Provenance if conflict */}
        {isConflict && (
          <div className="bg-[#E0AFA0]/15 border-l-2 border-[#8d3b2a] rounded-r-lg px-3.5 py-2.5 mb-3 text-label-caption text-[#241d18] font-medium">
            Needs clarification prior to credential handover sign-off.
          </div>
        )}

        {/* Footer & Source link */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#d8d0c0] text-label-mono-metadata font-label-mono-metadata text-[#6B635E]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-medium">
              <FileText size={13} />
              {event.source_ref}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectSource && onSelectSource(event)}
            className="inline-flex items-center gap-1 text-[#241d18] hover:underline transition-colors font-medium"
          >
            <span>View source link</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
