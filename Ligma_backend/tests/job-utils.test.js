import { test } from "node:test";
import assert from "node:assert/strict";

import { buildStableJobId } from "../src/jobs/job.utils.js";
import { buildClassificationJobId } from "../src/jobs/classification.job.js";

test("buildStableJobId never contains a colon", () => {
  const id = buildStableJobId("classify", "64f1a2b3c4d5e6f7a8b9c0d1", "64f1a2b3c4d5e6f7a8b9c0d2", "2026-01-01T12:00:00.000Z");
  assert.equal(id.includes(":"), false);
});

test("buildStableJobId only contains BullMQ-safe characters", () => {
  const id = buildStableJobId("classify", "64f1a2b3c4d5e6f7a8b9c0d1", "64f1a2b3c4d5e6f7a8b9c0d2", "2026-01-01T12:00:00.000Z");
  assert.match(id, /^[A-Za-z0-9_.-]+$/);
});

test("buildStableJobId is deterministic for identical inputs", () => {
  const a = buildStableJobId("classify", "wsid", "nodeid", "2026-01-01T12:00:00.000Z");
  const b = buildStableJobId("classify", "wsid", "nodeid", "2026-01-01T12:00:00.000Z");
  assert.equal(a, b);
});

test("buildStableJobId distinguishes different logical jobs", () => {
  const a = buildStableJobId("classify", "wsid", "node-A", "2026-01-01T12:00:00.000Z");
  const b = buildStableJobId("classify", "wsid", "node-B", "2026-01-01T12:00:00.000Z");
  assert.notEqual(a, b);
});

test("buildClassificationJobId reproduces the real Phase 16.2 crash scenario safely", () => {
  const payload = {
    workspaceId: "64f1a2b3c4d5e6f7a8b9c0d1",
    nodeId: "64f1a2b3c4d5e6f7a8b9c0d2",
    nodeUpdatedAt: "2026-01-01T12:00:00.000Z",
  };
  const id = buildClassificationJobId(payload);
  assert.equal(id.includes(":"), false);
  assert.match(id, /^[A-Za-z0-9_.-]+$/);
  assert.equal(id, buildClassificationJobId(payload));
});