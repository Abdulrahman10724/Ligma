import { MongoClient } from "mongodb";

const uri = "mongodb+srv://codewithrahman_db_user:NPlSAuaugFoMUEum@ligmadb.pq0g3hl.mongodb.net/?appName=LigmaDB";

const client = new MongoClient(uri);

try {
  await client.connect();
  console.log("Connected Successfully");
} catch (err) {
  console.error("Error: ",err);
}