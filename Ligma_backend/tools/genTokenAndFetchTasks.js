import { connectDB, getCollection } from "../src/config/db.config.js";
import { signAccessToken } from "../src/utils/jwt.util.js";
import axios from "axios";

(async () => {
  try {
    await connectDB();
    const user = await getCollection("users").findOne({});
    if (!user) {
      console.error("no users found in db");
      process.exit(1);
    }
    const token = signAccessToken({ id: user._id.toString(), email: user.email });
    console.log("Generated token for user:", user._id.toString());

    const workspaceId = process.argv[2] || "6a4cdde3ac668440045023a9";
    const res = await axios.get(`http://localhost:5000/api/v1/workspaces/${workspaceId}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("HTTP", res.status, JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err?.message || err);
    process.exit(1);
  }
})();
