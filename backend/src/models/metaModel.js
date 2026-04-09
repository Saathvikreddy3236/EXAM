import { query } from "../db.js";

export async function getCategories() {
  const result = await query(
    'SELECT cat_id, cat_name FROM "CATEGORY" ORDER BY cat_name ASC'
  );
  return result.rows;
}

export async function getPaymentModes() {
  const result = await query(
    'SELECT mode_id, mode_name FROM "PAYMENT_MODE" ORDER BY mode_name ASC'
  );
  return result.rows;
}
