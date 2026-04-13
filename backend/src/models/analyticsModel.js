import { query } from "../db.js";
import { fromBaseCurrency } from "../utils/currency.js";
import { getUserCurrency } from "./userModel.js";

export function buildShareAwareExpenseCte(filters = {}, usernameParamIndex = 1) {
  const params = [];
  const conditions = [];

  if (filters.categoryIds?.length) {
    params.push(filters.categoryIds);
    conditions.push(`entries.cat_id = ANY($${usernameParamIndex + params.length})`);
  }

  if (filters.modeIds?.length) {
    params.push(filters.modeIds);
    conditions.push(`entries.mode_id = ANY($${usernameParamIndex + params.length})`);
  }

  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`entries.date >= $${usernameParamIndex + params.length}`);
  }

  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`entries.date <= $${usernameParamIndex + params.length}`);
  }

  if (filters.minAmount !== null && filters.minAmount !== undefined) {
    params.push(filters.minAmount);
    conditions.push(`entries.user_share >= $${usernameParamIndex + params.length}`);
  }

  if (filters.maxAmount !== null && filters.maxAmount !== undefined) {
    params.push(filters.maxAmount);
    conditions.push(`entries.user_share <= $${usernameParamIndex + params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(entries.title ILIKE $${usernameParamIndex + params.length} OR COALESCE(entries.note, '') ILIKE $${usernameParamIndex + params.length})`);
  }

  return {
    sql: `
      WITH shared_paid AS (
        SELECT
          p.id AS source_id,
          p.date,
          p.title,
          p.note,
          p.cat_id,
          c.cat_name,
          p.mode_id,
          pm.mode_name,
          ROUND((p.amount_base - COALESCE(share_totals.total_owed_base, 0))::numeric, 2) AS user_share
        FROM "PAYMENT" p
        JOIN (
          SELECT payment_id, paid_username, SUM(amount_owed_base) AS total_owed_base
          FROM "SHARED_EXPENSE"
          GROUP BY payment_id, paid_username
        ) share_totals ON share_totals.payment_id = p.id
        JOIN "CATEGORY" c ON c.cat_id = p.cat_id
        JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
        WHERE share_totals.paid_username = $${usernameParamIndex}
      ),
      entries AS (
        SELECT
          e.id AS source_id,
          p.date,
          p.title,
          p.note,
          p.cat_id,
          c.cat_name,
          p.mode_id,
          pm.mode_name,
          ROUND(p.amount_base::numeric, 2) AS user_share
        FROM "EXPENSE" e
        JOIN "PAYMENT" p ON p.id = e.payment_id
        JOIN "CATEGORY" c ON c.cat_id = p.cat_id
        JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
        WHERE e.username = $${usernameParamIndex}

        UNION ALL

        SELECT * FROM shared_paid

        UNION ALL

        SELECT
          se.id AS source_id,
          p.date,
          p.title,
          p.note,
          p.cat_id,
          c.cat_name,
          p.mode_id,
          pm.mode_name,
          ROUND(se.amount_owed_base::numeric, 2) AS user_share
        FROM "SHARED_EXPENSE" se
        JOIN "PAYMENT" p ON p.id = se.payment_id
        JOIN "CATEGORY" c ON c.cat_id = p.cat_id
        JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
        WHERE se.owed_username = $${usernameParamIndex}
      )
    `,
    whereClause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

function appendCondition(whereClause, condition) {
  return whereClause ? `${whereClause} AND ${condition}` : `WHERE ${condition}`;
}

function convertMoneyValue(value, currency) {
  return fromBaseCurrency(value || 0, currency);
}

export async function getExpenseAnalytics(username, filters = {}) {
  const currency = await getUserCurrency(username);
  const cte = buildShareAwareExpenseCte(filters);
  const baseParams = [username, ...cte.params];

  const [categoryRows, monthlyRows, dailyRows, monthlySummaryRows, yearlySummaryRows] = await Promise.all([
    query(
      `${cte.sql}
       SELECT
         entries.cat_id,
         entries.cat_name,
         ROUND(SUM(entries.user_share)::numeric, 2) AS total_spent
       FROM entries
       ${appendCondition(cte.whereClause, "date_trunc('month', entries.date) = date_trunc('month', CURRENT_DATE)")}
       GROUP BY entries.cat_id, entries.cat_name
       ORDER BY total_spent DESC`,
      baseParams
    ),
    query(
      `${cte.sql}
       SELECT
         TO_CHAR(date_trunc('month', entries.date), 'Mon YYYY') AS month_label,
         date_trunc('month', entries.date) AS month_key,
         ROUND(SUM(entries.user_share)::numeric, 2) AS total_spent
       FROM entries
       ${appendCondition(
         appendCondition(cte.whereClause, "entries.date >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'"),
         "entries.date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'"
       )}
       GROUP BY month_key, TO_CHAR(date_trunc('month', entries.date), 'Mon YYYY')
       ORDER BY month_key ASC`,
      baseParams
    ),
    query(
      `${cte.sql}
       SELECT
         TO_CHAR(entries.date, 'DD Mon') AS day_label,
         entries.date AS day_key,
         ROUND(SUM(entries.user_share)::numeric, 2) AS total_spent
       FROM entries
       ${appendCondition(cte.whereClause, "date_trunc('month', entries.date) = date_trunc('month', CURRENT_DATE)")}
       GROUP BY day_key, TO_CHAR(entries.date, 'DD Mon')
       ORDER BY day_key ASC`,
      baseParams
    ),
    query(
      `${cte.sql}
       SELECT
         ROUND(COALESCE(SUM(entries.user_share), 0)::numeric, 2) AS total_expenses
       FROM entries
       ${appendCondition(cte.whereClause, "date_trunc('month', entries.date) = date_trunc('month', CURRENT_DATE)")}`,
      baseParams
    ),
    query(
      `${cte.sql}
       SELECT
         ROUND(COALESCE(SUM(entries.user_share), 0)::numeric, 2) AS total_expenses
       FROM entries
       ${appendCondition(cte.whereClause, "date_trunc('year', entries.date) = date_trunc('year', CURRENT_DATE)")}`,
      baseParams
    ),
  ]);

  const categoryTotalsBase = categoryRows.rows.map((row) => ({
    cat_id: row.cat_id,
    cat_name: row.cat_name,
    total_spent_base: Number(row.total_spent),
  }));
  const currentMonthTotalBase = categoryTotalsBase.reduce((sum, row) => sum + row.total_spent_base, 0);
  const pieChart = categoryTotalsBase.map((row) => ({
    cat_id: row.cat_id,
    cat_name: row.cat_name,
    total_spent: convertMoneyValue(row.total_spent_base, currency),
    percentage: currentMonthTotalBase > 0 ? Number(((row.total_spent_base / currentMonthTotalBase) * 100).toFixed(2)) : 0,
    currency_code: currency,
  }));

  const monthlyCategoryRows = await query(
    `${cte.sql}
     SELECT
       entries.cat_id,
       entries.cat_name,
       ROUND(SUM(entries.user_share)::numeric, 2) AS total_spent
     FROM entries
     ${appendCondition(cte.whereClause, "date_trunc('month', entries.date) = date_trunc('month', CURRENT_DATE)")}
     GROUP BY entries.cat_id, entries.cat_name
     ORDER BY total_spent DESC`,
    baseParams
  );

  const yearlyBreakdownRows = await query(
    `${cte.sql}
     SELECT
       TO_CHAR(date_trunc('month', entries.date), 'Mon') AS month_label,
       EXTRACT(MONTH FROM entries.date) AS month_number,
       ROUND(SUM(entries.user_share)::numeric, 2) AS total_spent
     FROM entries
     ${appendCondition(cte.whereClause, "date_trunc('year', entries.date) = date_trunc('year', CURRENT_DATE)")}
     GROUP BY month_number, TO_CHAR(date_trunc('month', entries.date), 'Mon')
     ORDER BY month_number ASC`,
    baseParams
  );

  const yearlyHighestCategoryRows = await query(
    `${cte.sql}
     SELECT
       entries.cat_name,
       ROUND(SUM(entries.user_share)::numeric, 2) AS total_spent
     FROM entries
     ${appendCondition(cte.whereClause, "date_trunc('year', entries.date) = date_trunc('year', CURRENT_DATE)")}
     GROUP BY entries.cat_name
     ORDER BY total_spent DESC
     LIMIT 1`,
    baseParams
  );

  return {
    pieChart,
    barChart: monthlyRows.rows.map((row) => ({
      month: row.month_label,
      total_spent: convertMoneyValue(row.total_spent, currency),
      currency_code: currency,
    })),
    lineChart: dailyRows.rows.map((row) => ({
      date: row.day_label,
      total_spent: convertMoneyValue(row.total_spent, currency),
      currency_code: currency,
    })),
    monthlyAnalysis: {
      total_expenses: convertMoneyValue(monthlySummaryRows.rows[0]?.total_expenses, currency),
      category_totals: monthlyCategoryRows.rows.map((row) => ({
        cat_id: row.cat_id,
        cat_name: row.cat_name,
        total_spent: convertMoneyValue(row.total_spent, currency),
        currency_code: currency,
      })),
      currency_code: currency,
    },
    yearlyAnalysis: {
      total_expenses: convertMoneyValue(yearlySummaryRows.rows[0]?.total_expenses, currency),
      monthly_breakdown: yearlyBreakdownRows.rows.map((row) => ({
        month: row.month_label,
        total_spent: convertMoneyValue(row.total_spent, currency),
        currency_code: currency,
      })),
      highest_spending_category: yearlyHighestCategoryRows.rows[0]
        ? {
            cat_name: yearlyHighestCategoryRows.rows[0].cat_name,
            total_spent: convertMoneyValue(yearlyHighestCategoryRows.rows[0].total_spent, currency),
            currency_code: currency,
          }
        : null,
      currency_code: currency,
    },
  };
}
