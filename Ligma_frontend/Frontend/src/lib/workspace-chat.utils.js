import { format, formatDistanceToNowStrict, isSameDay, isToday, parseISO } from "date-fns";

const NODE_REFERENCE_PATTERN = /\[\[node:([^|\]]+)\|([^\]]+)\]\]/g;
const MENTION_PATTERN = /(^|\s)@([\w.-]+)/g;

export function normalizeChannel(channel = {}, index = 0) {
  return {
    id: String(channel.id || channel._id || `channel-${index}`),
    name: channel.name || channel.slug || `channel-${index + 1}`,
    description: channel.description || channel.topic || "",
    createdBy: channel.createdBy || channel.userId || null,
    archived: Boolean(channel.archived),
    isDefault: Boolean(channel.isDefault || index === 0),
    unreadCount: Number(channel.unreadCount || 0),
    updatedAt: channel.updatedAt || channel.lastMessageAt || channel.createdAt || new Date().toISOString(),
  };
}

export function extractNodeReferences(content = "") {
  return Array.from(content.matchAll(NODE_REFERENCE_PATTERN)).map((match) => ({
    id: String(match[1]),
    label: match[2],
  }));
}

export function extractMentions(content = "") {
  return Array.from(content.matchAll(MENTION_PATTERN)).map((match) => match[2]);
}

export function normalizeMessage(message = {}) {
  const content = message.content || message.body || message.text || "";
  const createdAt = message.createdAt || message.sentAt || new Date().toISOString();
  const updatedAt = message.updatedAt || message.editedAt || createdAt;
  const sender = message.user || message.sender || {};

  return {
    id: String(message.id || message._id || crypto.randomUUID?.() || `${Date.now()}`),
    channelId: String(message.channelId || message.channel?.id || message.channel?._id || ""),
    content,
    createdAt,
    updatedAt,
    edited: createdAt !== updatedAt,
    user: {
      id: String(sender.id || sender._id || message.userId || message.senderId || "unknown"),
      name: sender.name || message.userName || message.senderName || "Unknown user",
      email: sender.email || message.userEmail || "",
      avatarUrl: sender.avatarUrl || message.avatarUrl || null,
      role: sender.role || message.userRole || message.role || null,
    },
    nodeReferences: message.nodeReferences || message.nodeRefs || extractNodeReferences(content),
    mentions: message.mentions || extractMentions(content),
    pending: Boolean(message.pending),
    failed: Boolean(message.failed),
  };
}

export function groupMessages(messages = []) {
  return messages.map((message, index) => {
    const previous = messages[index - 1];
    const previousDate = previous ? parseISO(previous.createdAt) : null;
    const currentDate = parseISO(message.createdAt);

    const isGrouped = Boolean(
      previous &&
      previous.user.id === message.user.id &&
      currentDate.getTime() - previousDate.getTime() < 5 * 60 * 1000 &&
      isSameDay(previousDate, currentDate)
    );

    return {
      ...message,
      isGrouped,
      showDateSeparator: !previous || !isSameDay(previousDate, currentDate),
      dateLabel: isToday(currentDate) ? "Today" : format(currentDate, "EEEE, MMM d"),
    };
  });
}

export function formatMessageTime(timestamp) {
  if (!timestamp) return "";
  return format(parseISO(timestamp), "h:mm a");
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  return formatDistanceToNowStrict(parseISO(timestamp), { addSuffix: true });
}

export function serializeNodeReference(node) {
  return `[[node:${node.id}|${(node.data?.text || node.data?.label || node.name || node.type || "Node").replace(/\]/g, "") }]]`;
}

export function splitMessageContent(content = "") {
  const parts = [];
  let lastIndex = 0;

  for (const match of content.matchAll(NODE_REFERENCE_PATTERN)) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }

    parts.push({
      type: "node",
      id: String(match[1]),
      label: match[2],
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  return parts.length ? parts : [{ type: "text", value: content }];
}

export default {
  normalizeChannel,
  normalizeMessage,
  groupMessages,
  formatMessageTime,
  formatRelativeTime,
  extractNodeReferences,
  extractMentions,
  serializeNodeReference,
  splitMessageContent,
};
