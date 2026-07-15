import { connectDB, getCollection } from "../src/config/db.config.js";
import { ObjectId } from "mongodb";

const workspaceId = process.argv[2] || "6a4cdde3ac668440045023a9";

(async () => {
  try {
    await connectDB();
    const tasks = await getCollection("tasks")
      .find({ workspaceId: new ObjectId(workspaceId) })
      .toArray();
    console.log(JSON.stringify(tasks, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("inspectTasks failed:", err?.message || err);
    process.exit(1);
  }
})();
