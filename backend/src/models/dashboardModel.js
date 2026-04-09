import { query } from "../db.js";

export async function getDashboardSummary(username) {
  const result = await query(
    `WITH personal AS (
        SELECT COALESCE(SUM(p.amount), 0) AS total
        FROM "EXPENSE" e
        JOIN "PAYMENT" p ON p.id = e.payment_id
        WHERE e.username = $1
      ),
      paid_shared AS (
        SELECT COALESCE(SUM(se.total_owed), 0) AS total
        FROM (
          SELECT payment_id, paid_username, SUM(amount_owed) AS total_owed
          FROM "SHARED_EXPENSE"
          GROUP BY payment_id, paid_username
        ) se
        WHERE se.paid_username = $1
      ),
      owed_shared AS (
        SELECT COALESCE(SUM(amount_owed), 0) AS total
        FROM "SHARED_EXPENSE"
        WHERE owed_username = $1
      ),
      owe AS (
        SELECT COALESCE(SUM(amount_owed - amount_repaid), 0) AS total
        FROM "SHARED_EXPENSE"
        WHERE owed_username = $1 AND status = 'pending'
      ),
      receivable AS (
        SELECT COALESCE(SUM(amount_owed - amount_repaid), 0) AS total
        FROM "SHARED_EXPENSE"
        WHERE paid_username = $1 AND status = 'pending'
      )
      SELECT
        ROUND((personal.total + paid_shared.total + owed_shared.total)::numeric, 2) AS total_expenses,
        ROUND(owe.total::numeric, 2) AS you_owe,
        ROUND(receivable.total::numeric, 2) AS you_are_owed,
        ROUND((receivable.total - owe.total)::numeric, 2) AS net_balance
      FROM personal, paid_shared, owed_shared, owe, receivable`,
    [username]
  );

  if (!result.rows[0]) {
    return {
      total_expenses: "0.00",
      you_owe: "0.00",
      you_are_owed: "0.00",
      net_balance: "0.00",
    };
  }

  return result.rows[0];
}
