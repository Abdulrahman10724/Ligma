import { test } from "node:test";
import assert from "node:assert/strict";
import { taskJobSchema } from "../src/jobs/task.job.js";

test("taskJobSchema rejects payload without actorId", () => {
  assert.throws(() => {
    taskJobSchema.parse({
      workspaceId: "64f1a2b3c4d5e6f7a8b9c0d1",
      nodeId: "64f1a2b3c4d5e6f7a8b9c0d2",
      action: "upsert",
    });
  });
});

test("taskJobSchema accepts payload with valid actorId", () => {
  const parsed = taskJobSchema.parse({
    workspaceId: "64f1a2b3c4d5e6f7a8b9c0d1",
    nodeId: "64f1a2b3c4d5e6f7a8b9c0d2",
    actorId: "64f1a2b3c4d5e6f7a8b9c0d3",
    action: "upsert",
  });
  assert.equal(parsed.actorId, "64f1a2b3c4d5e6f7a8b9c0d3");
});