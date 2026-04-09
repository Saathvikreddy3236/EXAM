import { query } from "../db.js";

export async function getAmountsOwed(username) {
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
        se.amount_repaid,
        ROUND((se.amount_owed - se.amount_repaid)::numeric, 2) AS amount_remaining,
        se.status
      FROM "SHARED_EXPENSE" se
      JOIN "PAYMENT" p ON p.id = se.payment_id
      JOIN "CATEGORY" c ON c.cat_id = p.cat_id
      JOIN "USER" u ON u.username = se.paid_username
      WHERE se.owed_username = $1
      ORDER BY p.date DESC, se.id DESC`,
    [username]
  );

  return result.rows;
}

export async function getAmountsReceivable(username) {
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
        se.amount_repaid,
        ROUND((se.amount_owed - se.amount_repaid)::numeric, 2) AS amount_remaining,
        se.status
      FROM "SHARED_EXPENSE" se
      JOIN "PAYMENT" p ON p.id = se.payment_id
      JOIN "CATEGORY" c ON c.cat_id = p.cat_id
      JOIN "USER" u ON u.username = se.owed_username
      WHERE se.paid_username = $1
      ORDER BY p.date DESC, se.id DESC`,
    [username]
  );

  return result.rows;
}
