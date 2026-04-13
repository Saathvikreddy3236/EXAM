import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";
import { getBaseCurrency } from "./utils/currency.js";
import { hashPassword } from "./utils/password.js";

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
const demoUserSeed = {
  username: "demoUser",
  email: "demo@testing.com",
  fullname: "Demo User",
  currency_preferred: "USD",
  password: "Demo@123",
};

export async function initDatabase() {
  const schemaPath = path.join(__dirname, "database", "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  await query(schemaSql);
  await query('ALTER TABLE "PAYMENT" ADD COLUMN IF NOT EXISTS note VARCHAR(200)');
  await query(`ALTER TABLE "PAYMENT" ADD COLUMN IF NOT EXISTS currency_code VARCHAR(12) NOT NULL DEFAULT '${getBaseCurrency()}'`);
  await query('ALTER TABLE "PAYMENT" ADD COLUMN IF NOT EXISTS amount_base NUMERIC(12, 2)');
  await query(`UPDATE "PAYMENT" SET currency_code = COALESCE(currency_code, '${getBaseCurrency()}') WHERE currency_code IS NULL`);
  await query('UPDATE "PAYMENT" SET amount_base = COALESCE(amount_base, amount) WHERE amount_base IS NULL');

  await query('ALTER TABLE "SHARED_EXPENSE" ADD COLUMN IF NOT EXISTS amount_owed_base NUMERIC(12, 2)');
  await query('ALTER TABLE "SHARED_EXPENSE" ADD COLUMN IF NOT EXISTS amount_repaid_base NUMERIC(12, 2) NOT NULL DEFAULT 0');
  await query('UPDATE "SHARED_EXPENSE" SET amount_owed_base = COALESCE(amount_owed_base, amount_owed) WHERE amount_owed_base IS NULL');
  await query('UPDATE "SHARED_EXPENSE" SET amount_repaid_base = COALESCE(amount_repaid_base, amount_repaid) WHERE amount_repaid_base IS NULL');

  await query(`ALTER TABLE "REPAYMENTS" ADD COLUMN IF NOT EXISTS currency_code VARCHAR(12) NOT NULL DEFAULT '${getBaseCurrency()}'`);
  await query('ALTER TABLE "REPAYMENTS" ADD COLUMN IF NOT EXISTS amount_base NUMERIC(12, 2)');
  await query(`UPDATE "REPAYMENTS" SET currency_code = COALESCE(currency_code, '${getBaseCurrency()}') WHERE currency_code IS NULL`);
  await query('UPDATE "REPAYMENTS" SET amount_base = COALESCE(amount_base, amount) WHERE amount_base IS NULL');

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

  const demoPasswordHash = hashPassword(demoUserSeed.password);
  await query(
    `INSERT INTO "USER" (username, email, fullname, currency_preferred, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (username)
     DO UPDATE SET
       email = EXCLUDED.email,
       fullname = EXCLUDED.fullname,
       currency_preferred = EXCLUDED.currency_preferred,
       password_hash = EXCLUDED.password_hash`,
    [
      demoUserSeed.username,
      demoUserSeed.email,
      demoUserSeed.fullname,
      demoUserSeed.currency_preferred,
      demoPasswordHash,
    ]
  );
}

export async function verifyDatabaseConnection() {
  const result = await query("SELECT NOW() AS server_time");
  return result.rows[0];
}
