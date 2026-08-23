 import { connectDB, getCollection } from "../src/config/db.config.js";

// One-off cleanup: for each workspace, if two zones share the same
// (trimmed, case-insensitive) name, keep only the most recently updated
// one and delete the rest.
const workspaceId = process.argv[2];

(async () => {
  try {
    await connectDB();
    const zonesCol = getCollection("zones");

    const query = workspaceId ? { workspaceId: new (await import("mongodb")).ObjectId(workspaceId) } : {};
    const zones = await zonesCol.find(query).toArray();

    const groups = new Map(); // `${workspaceId}::${nameKey}` -> zones[]
    for (const zone of zones) {
      const key = `${zone.workspaceId.toString()}::${(zone.name || "").trim().toLowerCase()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(zone);
    }

    let deleted = 0;
    for (const group of groups.values()) {
      if (group.length <= 1) continue;
      group.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      const [, ...duplicates] = group; // keep the newest, drop the rest
      for (const dup of duplicates) {
        await zonesCol.deleteOne({ _id: dup._id });
        console.log(`Deleted duplicate zone "${dup.name}" (${dup._id})`);
        deleted += 1;
      }
    }

    console.log(`Done. Removed ${deleted} duplicate zone(s).`);
    process.exit(0);
  } catch (err) {
    console.error("dedupeZones failed:", err?.message || err);
    process.exit(1);
  }
})();