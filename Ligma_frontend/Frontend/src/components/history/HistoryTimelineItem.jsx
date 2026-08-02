import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import HistoryEventIcon from "./HistoryEventIcon";
import HistoryMetadata from "./HistoryMetadata";

// ponytail: convert tech jargon code to clean human language text
const formatNodeType = (type) => {
  if (!type) return "Canvas Item";
  const map = {
    sticky: "Sticky Note",
    rectangle: "Rectangle",
    ellipse: "Circle",
    text: "Text Box",
    arrow: "Arrow Line",
  };
  return map[type.toLowerCase()] || type;
};

// ponytail: friendly labels + colour-name mapping for human-readable diffs
const FIELD_LABELS = {
  fill: "background colour",
  stroke: "border colour",
  color: "colour",
  textColor: "text colour",
  text: "text",
  label: "label",
};

const COLOR_NAMES = {
  "#fef3c7": "Yellow", "#feca57": "Yellow", "#ffec99": "Light Yellow",
  "#fce7f3": "Pink", "#eebefa": "Purple", "#a855f7": "Purple",
  "#dbeafe": "Blue", "#3b82f6": "Blue", "#1971c2": "Blue", "#a5d8ff": "Light Blue",
  "#d1fae5": "Green", "#22c55e": "Green", "#2f9e44": "Green", "#b2f2bb": "Light Green",
  "#ffedd5": "Orange", "#f08c00": "Orange",
  "#ef4444": "Red", "#e03131": "Red", "#ffc9c9": "Light Red",
  "#000000": "Black", "#18181b": "Black", "#ffffff": "White",
  "rgba(0,0,0,0)": "Transparent", "transparent": "Transparent",
};

function friendlyColor(value) {
  if (!value) return "None";
  const key = String(value).toLowerCase();
  return COLOR_NAMES[key] || value;
}

// ponytail: parse events into clear non-technical sentences.
// Wrapped in try/catch so a malformed/legacy payload never breaks the timeline.
const parseEventText = (event) => {
  try {
    const user = event.user?.name || "Someone";
    const payload = event.payload || {};
    const nodeType = formatNodeType(payload.snapshot?.type || payload.type);

    switch (event.eventType) {
      case "NODE_CREATED":
        return {
          title: `${user} created a new ${nodeType}`,
          desc: payload.snapshot?.data?.text
            ? `Added text: "${payload.snapshot.data.text}"`
            : "Placed a new item on the canvas",
        };

      case "NODE_UPDATED": {
        const prev = payload.previousData || {};
        const next = payload.nextData || {};
        const changedKeys = Object.keys(next);

        // Colour field changed (fill / stroke / color / textColor)
        const colorKey = changedKeys.find((k) => ["fill", "stroke", "color", "textColor"].includes(k));
        if (colorKey) {
          const label = FIELD_LABELS[colorKey] || "colour";
          return {
            title: `${user} changed ${nodeType} ${label} from ${friendlyColor(prev[colorKey])} to ${friendlyColor(next[colorKey])}`,
            desc: `${label[0].toUpperCase()}${label.slice(1)} updated`,
          };
        }

        // Text / label changed
        const textKey = changedKeys.find((k) => k === "text" || k === "label");
        if (textKey) {
          const oldText = prev[textKey] || "(empty)";
          const newText = next[textKey] || "(empty)";
          return {
            title: `${user} changed the text on a ${nodeType}`,
            desc: `"${oldText}" → "${newText}"`,
          };
        }

        return {
          title: `${user} updated a ${nodeType}`,
          desc: "Modified item attributes on the canvas",
        };
      }

      case "NODE_MOVED":
        return {
          title: `${user} moved a ${nodeType}`,
          desc: "Dragged item to a new position on the canvas",
        };

      case "NODE_RESIZED": {
        const prevData = payload.previousData || {};
        const nextData = payload.nextData || {};
        const dims = [];
        if (nextData.width !== undefined) dims.push(`Width ${prevData.width ?? "?"} → ${nextData.width}`);
        if (nextData.height !== undefined) dims.push(`Height ${prevData.height ?? "?"} → ${nextData.height}`);
        if (nextData.radius !== undefined) dims.push(`Radius ${prevData.radius ?? "?"} → ${nextData.radius}`);
        return {
          title: `${user} resized a ${nodeType}`,
          desc: dims.length ? dims.join(" · ") : "Adjusted size boundary dimensions",
        };
      }

      case "NODE_DELETED":
        return {
          title: `${user} deleted a ${nodeType}`,
          desc: "Removed item from the active canvas",
        };

      case "NODE_LOCKED":
        return {
          title: `${user} locked a ${nodeType}`,
          desc: "Protected this element from modifications",
        };

      case "NODE_UNLOCKED":
        return {
          title: `${user} unlocked a ${nodeType}`,
          desc: "Restored editing access for all members",
        };

      case "NODE_PERMISSION_CHANGED": {
        const nextIds = Array.isArray(payload.nextAllowedUserIds) ? payload.nextAllowedUserIds : [];
        return {
          title: `${user} changed permissions on a ${nodeType}`,
          desc: nextIds.length
            ? `Restricted editing to ${nextIds.length} selected member${nextIds.length === 1 ? "" : "s"} (Lead always included)`
            : "Opened editing to all contributors",
        };
      }

      case "TASK_CREATED":
        return {
          title: `${user} created a task`,
          desc: `"${payload.snapshot?.title || "Untitled task"}"`,
        };

      case "TASK_UPDATED": {
        const statusChanged = payload.nextFields?.status !== undefined;
        const taskTitle = payload.nextFields?.title;
        return {
          title: taskTitle ? `${user} updated task "${taskTitle}"` : `${user} updated a task`,
          desc: statusChanged
            ? `Status changed to "${payload.nextFields.status}"`
            : "Task details updated",
        };
      }

      case "TASK_DELETED":
        return {
          title: `${user} deleted a task`,
          desc: `Removed: "${payload.snapshot?.title || "Untitled task"}"`,
        };

      default:
        return {
          title: `${user} performed an action`,
          desc: event.eventType ? `Event: ${event.eventType}` : "Workspace event occurred",
        };
    }
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return {
      title: "Workspace activity",
      desc: "An event occurred, but its details couldn't be parsed.",
    };
  }
};
// ponytail: define tag badges with distinct colors to avoid plain colors
const getBadges = (eventType) => {
  const badges = [];
  if (eventType.startsWith("NODE_")) {
    badges.push({ label: "Node", style: "bg-blue-500/10 text-blue-500 border-blue-500/20" });
  } else if (eventType.startsWith("TASK_")) {
    badges.push({ label: "Task", style: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" });
  } else {
    badges.push({ label: "Workspace", style: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" });
  }

  if (eventType.includes("CREATE")) {
    badges.push({ label: "Create", style: "bg-teal-500/10 text-teal-500 border-teal-500/20" });
  } else if (eventType.includes("UPDATE")) {
    badges.push({ label: "Update", style: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" });
  } else if (eventType.includes("DELETE")) {
    badges.push({ label: "Delete", style: "bg-red-500/10 text-red-500 border-red-500/20" });
  } else if (eventType.includes("MOVE")) {
    badges.push({ label: "Move", style: "bg-purple-500/10 text-purple-500 border-purple-500/20" });
  } else if (eventType.includes("LOCK")) {
    badges.push({ label: "Lock", style: "bg-amber-500/10 text-amber-500 border-amber-500/20" });
  } else if (eventType.includes("PERMISSION")) {
    badges.push({ label: "Permission", style: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" });
  }

  return badges;
};

// ponytail: Memoized item row with lift transition, badge highlights, and relative time titles
export default React.memo(function HistoryTimelineItem({ event }) {
  // eslint-disable-next-line no-useless-assignment
  let relativeTime = "";
  // eslint-disable-next-line no-useless-assignment
  let absoluteTime = "";

  try {
    const date = event.createdAt ? new Date(event.createdAt) : new Date();
    relativeTime = formatDistanceToNow(date, { addSuffix: true });
    absoluteTime = format(date, "dd MMMM yyyy, hh:mm a");
  } catch (err) {
    relativeTime = "some time ago";
    absoluteTime = "Unknown Date";
  }

  const { title, desc } = parseEventText(event);
  const badges = getBadges(event.eventType || "");

  return (
    <div className="relative group transition-all duration-300">
      {/* Timeline Bullet Dot */}
      <span className="absolute -left-[35px] top-4 w-4.5 h-4.5 rounded-full border-2 border-[color:var(--bg-surface)] bg-[color:var(--bg-primary)] group-hover:border-[color:var(--accent)] group-hover:scale-110 transition-all z-10 flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--text-secondary)] group-hover:bg-[color:var(--accent)] transition-colors"></span>
      </span>

      {/* Card Content */}
      <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)]/70 hover:border-[color:var(--accent)]/50 rounded-xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            {/* Event Type Icon */}
            <div className="mt-0.5">
              <HistoryEventIcon eventType={event.eventType} />
            </div>

            {/* Event Descriptions */}
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[color:var(--text-primary)] leading-snug">
                {title}
              </h4>
              <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed">
                {desc}
              </p>
              
              {/* Event Badges */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {badges.map((badge, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.style}`}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Timestamp */}
          <div
            className="text-xs text-[color:var(--text-secondary)] select-none cursor-help hover:text-[color:var(--text-primary)] sm:text-right whitespace-nowrap self-start mt-1"
            title={absoluteTime}
          >
            {relativeTime}
          </div>
        </div>

        {/* Collapsible Payload Metadata */}
        <HistoryMetadata event={event} />
      </div>
    </div>
  );
});
