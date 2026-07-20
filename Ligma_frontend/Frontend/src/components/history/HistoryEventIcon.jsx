import React from "react";
import {
  Plus,
  Pencil,
  Move,
  Expand,
  Trash,
  Lock,
  Unlock,
  Shield,
  CheckSquare,
  Clipboard,
  Folder,
  Mail,
  HelpCircle,
} from "lucide-react";

// ponytail: map event types to Lucide icons and Tailwind styles, fallback to HelpCircle
export default function HistoryEventIcon({ eventType, className = "w-4 h-4" }) {
  let Icon = HelpCircle;
  let colorClass = "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";

  switch (eventType) {
    case "NODE_CREATED":
      Icon = Plus;
      colorClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/15";
      break;
    case "NODE_UPDATED":
      Icon = Pencil;
      colorClass = "text-blue-500 bg-blue-500/10 border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/15";
      break;
    case "NODE_MOVED":
      Icon = Move;
      colorClass = "text-purple-500 bg-purple-500/10 border-purple-500/20 dark:text-purple-400 dark:bg-purple-500/15";
      break;
    case "NODE_RESIZED":
      Icon = Expand;
      colorClass = "text-orange-500 bg-orange-500/10 border-orange-500/20 dark:text-orange-400 dark:bg-orange-500/15";
      break;
    case "NODE_DELETED":
    case "TASK_DELETED":
      Icon = Trash;
      colorClass = "text-red-500 bg-red-500/10 border-red-500/20 dark:text-red-400 dark:bg-red-500/15";
      break;
    case "NODE_LOCKED":
      Icon = Lock;
      colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/15";
      break;
    case "NODE_UNLOCKED":
      Icon = Unlock;
      colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/15";
      break;
    case "NODE_PERMISSION_CHANGED":
      Icon = Shield;
      colorClass = "text-cyan-500 bg-cyan-500/10 border-cyan-500/20 dark:text-cyan-400 dark:bg-cyan-500/15";
      break;
    case "TASK_CREATED":
      Icon = CheckSquare;
      colorClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/15";
      break;
    case "TASK_UPDATED":
      Icon = Clipboard;
      colorClass = "text-blue-500 bg-blue-500/10 border-blue-500/20 dark:text-blue-400 dark:bg-blue-500/15";
      break;
    case "WORKSPACE_CREATED":
    case "WORKSPACE_UPDATED":
      Icon = Folder;
      colorClass = "text-zinc-500 bg-zinc-500/10 border-zinc-500/20 dark:text-zinc-400 dark:bg-zinc-500/15";
      break;
    case "INVITATION_SENT":
    case "INVITATION_ACCEPTED":
    case "INVITATION_REVOKED":
      Icon = Mail;
      colorClass = "text-indigo-500 bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-400 dark:bg-indigo-500/15";
      break;
    default:
      Icon = HelpCircle;
      colorClass = "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
  }

  return (
    <div className={`flex items-center justify-center p-2 rounded-full border ${colorClass}`}>
      <Icon className={className} />
    </div>
  );
}
