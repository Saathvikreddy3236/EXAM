import { initDatabase } from "../db.js";

async function run() {
  await initDatabase();
  console.log("Database initialized successfully.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Database initialization failed:", error.message);
  process.exit(1);
});
