import { query } from "../db.js";
import { fromBaseCurrency, toBaseCurrency } from "../utils/currency.js";
import { getUserCurrency } from "./userModel.js";
import { buildShareAwareExpenseCte } from "./analyticsModel.js";

export async function upsertBudget(username, catId, amount) {
  const currency = await getUserCurrency(username);
  const amountBase = toBaseCurrency(amount, currency);
  const result = await query(
    `INSERT INTO "BUDGET" (username, cat_id, amount)
     VALUES ($1, $2, $3)
     ON CONFLICT (username, cat_id)
     DO UPDATE SET amount = EXCLUDED.amount
     RETURNING username, cat_id, amount`,
    [username, catId, amountBase]
  );

  return result.rows[0];
}

export async function getBudgetsWithSpend(username, filters = {}) {
  const currency = await getUserCurrency(username);
  const cte = buildShareAwareExpenseCte(filters);
  const result = await query(
    `${cte.sql},
     combined AS (
       SELECT entries.cat_id, SUM(entries.user_share)::numeric AS total_spent
       FROM entries
       ${cte.whereClause}
       GROUP BY entries.cat_id
     )
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
    [username, ...cte.params]
  );

  return result.rows.map((row) => {
    const budgetAmount = fromBaseCurrency(row.budget_amount, currency);
    const totalSpent = fromBaseCurrency(row.total_spent, currency);

    return {
      ...row,
      budget_amount: budgetAmount,
      total_spent: totalSpent,
      percentage: budgetAmount === 0 ? 0 : Number(((totalSpent / budgetAmount) * 100).toFixed(2)),
      currency_code: currency,
    };
  });
}
