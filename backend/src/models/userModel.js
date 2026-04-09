import { query } from "../db.js";

export async function findUserByUsername(username) {
  const result = await query('SELECT * FROM "USER" WHERE username = $1', [username]);
  return result.rows[0] || null;
}

export async function findUserByEmail(email) {
  const result = await query('SELECT * FROM "USER" WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function createUser({
  username,
  email,
  fullname,
  currencyPreferred,
  passwordHash,
}) {
  const result = await query(
    `INSERT INTO "USER" (username, email, fullname, currency_preferred, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING username, email, fullname, currency_preferred`,
    [username, email, fullname, currencyPreferred, passwordHash]
  );

  return result.rows[0];
}

export async function updateUserProfile(username, { email, fullname, currencyPreferred }) {
  const result = await query(
    `UPDATE "USER"
     SET email = $2, fullname = $3, currency_preferred = $4
     WHERE username = $1
     RETURNING username, email, fullname, currency_preferred`,
    [username, email, fullname, currencyPreferred]
  );

  return result.rows[0];
}
