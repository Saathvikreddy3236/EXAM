import { query } from "../db.js";

export async function getExportRows(username) {
  const result = await query(
    `SELECT
        p.date AS date,
        p.title AS title,
        c.cat_name AS category,
        p.amount AS amount,
        'Personal' AS type,
        e.username AS paid_by,
        ''::varchar AS owed_by,
        'Completed' AS status
      FROM "EXPENSE" e
      JOIN "PAYMENT" p ON p.id = e.payment_id
      JOIN "CATEGORY" c ON c.cat_id = p.cat_id
      WHERE e.username = $1

      UNION ALL

      SELECT
        p.date AS date,
        p.title AS title,
        c.cat_name AS category,
        se.amount_owed AS amount,
        'Shared' AS type,
        se.paid_username AS paid_by,
        se.owed_username AS owed_by,
        INITCAP(se.status) AS status
      FROM "SHARED_EXPENSE" se
      JOIN "PAYMENT" p ON p.id = se.payment_id
      JOIN "CATEGORY" c ON c.cat_id = p.cat_id
      WHERE se.paid_username = $1 OR se.owed_username = $1

      UNION ALL

      SELECT
        r.date AS date,
        CONCAT(p.title, ' repayment') AS title,
        c.cat_name AS category,
        r.amount AS amount,
        'Shared' AS type,
        se.owed_username AS paid_by,
        se.paid_username AS owed_by,
        INITCAP(se.status) AS status
      FROM "REPAYMENTS" r
      JOIN "SHARED_EXPENSE" se ON se.id = r.shared_expense_id
      JOIN "PAYMENT" p ON p.id = se.payment_id
      JOIN "CATEGORY" c ON c.cat_id = p.cat_id
      WHERE se.paid_username = $1 OR se.owed_username = $1

      ORDER BY date DESC, title ASC`,
    [username]
  );

  return result.rows;
}
