import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool;

function createPoolConfig() {
  const missingValues = ["PGHOST", "PGUSER", "PGDATABASE", "JWT_SECRET"].filter(
    (key) => !process.env[key]
  );

  if (missingValues.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingValues.join(", ")}`
    );
  }

  if (
    typeof process.env.PGPASSWORD !== "string" ||
    process.env.PGPASSWORD.length === 0
  ) {
    throw new Error(
      "Missing PostgreSQL password. Create backend/.env and set PGPASSWORD."
    );
  }

  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  };
}

export function getPool() {
  if (!pool) {
    pool = new Pool(createPoolConfig());
  }

  return pool;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}

export async function withTransaction(callback) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

const categorySeeds = [
  "Food & Dining",
  "Transport",
  "Entertainment",
  "Shopping",
  "Health & Medical",
  "Education",
  "Utilities",
  "Other",
];

const paymentModeSeeds = ["Cash", "UPI", "Credit Card", "Debit Card", "Net Banking"];

export async function initDatabase() {
  const schemaPath = path.join(__dirname, "database", "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  await query(schemaSql);
  await query('ALTER TABLE "PAYMENT" ADD COLUMN IF NOT EXISTS note VARCHAR(200)');

  for (const category of categorySeeds) {
    await query(
      'INSERT INTO "CATEGORY" (cat_name) VALUES ($1) ON CONFLICT (cat_name) DO NOTHING',
      [category]
    );
  }

  for (const mode of paymentModeSeeds) {
    await query(
      'INSERT INTO "PAYMENT_MODE" (mode_name) VALUES ($1) ON CONFLICT (mode_name) DO NOTHING',
      [mode]
    );
  }
}

export async function verifyDatabaseConnection() {
  const result = await query("SELECT NOW() AS server_time");
  return result.rows[0];
}
