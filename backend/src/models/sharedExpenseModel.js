import { query } from "../db.js";
import { fromBaseCurrency } from "../utils/currency.js";
import { getUserCurrency } from "./userModel.js";

export async function getAmountsOwed(username) {
  const currency = await getUserCurrency(username);
  const result = await query(
    `SELECT
        se.id,
        se.payment_id,
        p.title,
        p.date,
        c.cat_name,
        se.paid_username,
        u.fullname AS paid_fullname,
        se.amount_owed,
        se.amount_owed_base,
        se.amount_repaid,
        se.amount_repaid_base,
        ROUND((se.amount_owed_base - se.amount_repaid_base)::numeric, 2) AS amount_remaining_base,
        se.status
      FROM "SHARED_EXPENSE" se
      JOIN "PAYMENT" p ON p.id = se.payment_id
      JOIN "CATEGORY" c ON c.cat_id = p.cat_id
      JOIN "USER" u ON u.username = se.paid_username
      WHERE se.owed_username = $1
      ORDER BY p.date DESC, se.id DESC`,
    [username]
  );

  return result.rows.map((row) => ({
    ...row,
    amount_owed: fromBaseCurrency(row.amount_owed_base ?? row.amount_owed, currency),
    amount_repaid: fromBaseCurrency(row.amount_repaid_base ?? row.amount_repaid, currency),
    amount_remaining: fromBaseCurrency(row.amount_remaining_base ?? 0, currency),
    currency_code: currency,
  }));
}

export async function getAmountsReceivable(username) {
  const currency = await getUserCurrency(username);
  const result = await query(
    `SELECT
        se.id,
        se.payment_id,
        p.title,
        p.date,
        c.cat_name,
        se.owed_username,
        u.fullname AS owed_fullname,
        se.amount_owed,
        se.amount_owed_base,
        se.amount_repaid,
        se.amount_repaid_base,
        ROUND((se.amount_owed_base - se.amount_repaid_base)::numeric, 2) AS amount_remaining_base,
        se.status
      FROM "SHARED_EXPENSE" se
      JOIN "PAYMENT" p ON p.id = se.payment_id
      JOIN "CATEGORY" c ON c.cat_id = p.cat_id
      JOIN "USER" u ON u.username = se.owed_username
      WHERE se.paid_username = $1
      ORDER BY p.date DESC, se.id DESC`,
    [username]
  );

  return result.rows.map((row) => ({
    ...row,
    amount_owed: fromBaseCurrency(row.amount_owed_base ?? row.amount_owed, currency),
    amount_repaid: fromBaseCurrency(row.amount_repaid_base ?? row.amount_repaid, currency),
    amount_remaining: fromBaseCurrency(row.amount_remaining_base ?? 0, currency),
    currency_code: currency,
  }));
}
