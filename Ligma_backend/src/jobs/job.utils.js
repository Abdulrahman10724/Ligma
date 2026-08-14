const buildStableJobId = (...parts) => parts.map((part) => String(part || "").trim()).filter(Boolean).join(":");

export { buildStableJobId };

export default { buildStableJobId };