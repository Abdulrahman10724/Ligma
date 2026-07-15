import { memo } from "react";
import { motion } from "motion/react";
import { Link2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// ponytail: match both http:// and bare www. URLs (same as backend Regex intent)
const URL_RE = /(https?:\/\/[^\s"'<>]+)|(www\.[^\s"'<>]+\.[^\s"'<>]+)/g;

function extractUrls(text = "") {
  return [...new Set((text.match(URL_RE) || []))];
}

function toHref(url) {
  return url.startsWith("http") ? url : `https://${url}`;
}

function UrlLink({ url }) {
  let display = url;
  try { display = new URL(toHref(url)).hostname.replace(/^www\./, "") + new URL(toHref(url)).pathname.replace(/\/$/, ""); } catch { /**/ }
  return (
    <a
      href={toHref(url)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-1.5 text-[11px] text-[color:var(--accent)] hover:underline break-all"
    >
      <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
      <span>{display || url}</span>
    </a>
  );
}

export const ReferenceItem = memo(function ReferenceItem({ task }) {
  // URLs from content
  const contentUrls = extractUrls([task.title, task.description].filter(Boolean).join("\n"));
  // URLs from backend Regex pipeline stored in metadata
  const metaRefs = (task.metadata?.references || []).filter(Boolean);
  // Merge, dedup
  const allUrls = [...new Set([...contentUrls, ...metaRefs])];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="group flex items-start gap-3 px-4 py-3 border-b border-[color:var(--border)] hover:bg-[color:var(--bg-surface)] transition-colors"
    >
      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/15 flex items-center justify-center">
        <Link2 className="w-3 h-3 text-violet-400" />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[color:var(--text-primary)] leading-5 mb-1">
          {task.title}
        </p>

        {allUrls.length > 0 ? (
          <div className="flex flex-col gap-1">
            {allUrls.map((url) => <UrlLink key={url} url={url} />)}
          </div>
        ) : task.description ? (
          <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed line-clamp-2">
            {task.description}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
});

export default ReferenceItem;
