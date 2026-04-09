import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "node:http";
import { initDatabase, verifyDatabaseConnection } from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import sharedExpenseRoutes from "./routes/sharedExpenseRoutes.js";
import repaymentRoutes from "./routes/repaymentRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import { initSocket } from "./socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    message: "Backend is running",
  });
});

app.get("/db-check", async (_req, res) => {
  try {
    const data = await verifyDatabaseConnection();
    res.json({
      ok: true,
      message: "PostgreSQL connection successful",
      serverTime: data.server_time,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/friends", friendRoutes);
app.use("/expense", expenseRoutes);
app.use("/budget", budgetRoutes);
app.use("/shared-expense", sharedExpenseRoutes);
app.use("/repayment", repaymentRoutes);
app.use("/meta", metaRoutes);
app.use("/export", exportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  await initDatabase();
  initSocket(server);
  server.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
