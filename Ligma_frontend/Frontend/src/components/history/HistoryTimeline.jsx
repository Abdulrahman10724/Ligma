import React from "react";
import HistoryTimelineItem from "./HistoryTimelineItem";

// ponytail: layout container representing the vertical track line of timeline cards
export default function HistoryTimeline({ events }) {
  return (
    <div className="relative ml-3 pl-6 border-l border-[color:var(--border)]/70 space-y-6">
      {events.map((event) => (
        <HistoryTimelineItem key={event.id || event._id} event={event} />
      ))}
    </div>
  );
}
