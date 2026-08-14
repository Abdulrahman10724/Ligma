// Central, BullMQ-safe deterministic job ID builder.
//
// BullMQ rejects certain characters in custom job IDs (e.g. ":"). Any value
// we feed in here — including ISO timestamps like nodeUpdatedAt, which
// contain colons themselves — must be sanitized per-segment, not just
// joined with a safe separator, otherwise unsafe characters leak through
// from inside a segment (e.g. "2026-01-01T12:00:00.000Z").
//
// Only [A-Za-z0-9_.-] are considered safe. Everything else is stripped
// (not replaced) so uniqueness/determinism is preserved: removing a fixed
// character from a string never changes whether two distinct inputs remain
// distinguishable, since digits/letters are untouched.

const JOB_ID_SEPARATOR = "-";
const UNSAFE_JOB_ID_CHARS = /[^A-Za-z0-9_.-]/g;

const sanitizeJobIdSegment = (value) =>
  String(value ?? "")
    .trim()
    .replace(UNSAFE_JOB_ID_CHARS, "");

const buildStableJobId = (...parts) =>
  parts.map(sanitizeJobIdSegment).filter(Boolean).join(JOB_ID_SEPARATOR);

const toIsoString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value; // already normalized
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
export {
  buildStableJobId,
  sanitizeJobIdSegment,
  JOB_ID_SEPARATOR,
  toIsoString,
};
export default {
  buildStableJobId,
  sanitizeJobIdSegment,
  JOB_ID_SEPARATOR,
  toIsoString,
};
