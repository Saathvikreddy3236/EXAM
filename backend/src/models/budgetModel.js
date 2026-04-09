import { query } from "../db.js";

const spendByCategoryQuery = `
  WITH personal_spend AS (
    SELECT p.cat_id, SUM(p.amount)::numeric AS spent
    FROM "EXPENSE" e
    JOIN "PAYMENT" p ON p.id = e.payment_id
    WHERE e.username = $1
    GROUP BY p.cat_id
  ),
  paid_shared AS (
    SELECT
      p.cat_id,
      SUM(p.amount - COALESCE(se.total_owed, 0))::numeric AS spent
    FROM "PAYMENT" p
    JOIN (
      SELECT payment_id, paid_username, SUM(amount_owed) AS total_owed
      FROM "SHARED_EXPENSE"
      GROUP BY payment_id, paid_username
    ) se ON se.payment_id = p.id
    WHERE se.paid_username = $1
    GROUP BY p.cat_id
  ),
  owed_shared AS (
    SELECT p.cat_id, SUM(se.amount_owed)::numeric AS spent
    FROM "SHARED_EXPENSE" se
    JOIN "PAYMENT" p ON p.id = se.payment_id
    WHERE se.owed_username = $1
    GROUP BY p.cat_id
  ),
  combined AS (
    SELECT cat_id, SUM(spent)::numeric AS total_spent
    FROM (
      SELECT * FROM personal_spend
      UNION ALL
      SELECT * FROM paid_shared
      UNION ALL
      SELECT * FROM owed_shared
    ) all_spend
    GROUP BY cat_id
  )
`;

export async function upsertBudget(username, catId, amount) {
  const result = await query(
    `INSERT INTO "BUDGET" (username, cat_id, amount)
     VALUES ($1, $2, $3)
     ON CONFLICT (username, cat_id)
     DO UPDATE SET amount = EXCLUDED.amount
     RETURNING username, cat_id, amount`,
    [username, catId, amount]
  );

  return result.rows[0];
}

export async function getBudgetsWithSpend(username) {
  const result = await query(
    `${spendByCategoryQuery}
     SELECT
       b.username,
       b.cat_id,
       c.cat_name,
       b.amount AS budget_amount,
       COALESCE(combined.total_spent, 0) AS total_spent,
       CASE
         WHEN b.amount = 0 THEN 0
         ELSE ROUND((COALESCE(combined.total_spent, 0) / b.amount) * 100, 2)
       END AS percentage
     FROM "BUDGET" b
     JOIN "CATEGORY" c ON c.cat_id = b.cat_id
     LEFT JOIN combined ON combined.cat_id = b.cat_id
     WHERE b.username = $1
     ORDER BY c.cat_name ASC`,
    [username]
  );

  return result.rows;
}
