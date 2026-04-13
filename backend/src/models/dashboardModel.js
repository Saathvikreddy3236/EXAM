import { query } from "../db.js";
import { fromBaseCurrency } from "../utils/currency.js";
import { getUserCurrency } from "./userModel.js";
import { buildShareAwareExpenseCte } from "./analyticsModel.js";

function buildSharedPendingFilter(username, roleColumn, filters = {}) {
  const params = [username];
  const conditions = [`se.${roleColumn} = $1`, `se.status = 'pending'`];

  if (filters.categoryIds?.length) {
    params.push(filters.categoryIds);
    conditions.push(`p.cat_id = ANY($${params.length})`);
  }
  if (filters.modeIds?.length) {
    params.push(filters.modeIds);
    conditions.push(`p.mode_id = ANY($${params.length})`);
  }
  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`p.date >= $${params.length}`);
  }
  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`p.date <= $${params.length}`);
  }
  if (filters.minAmount !== null && filters.minAmount !== undefined) {
    params.push(filters.minAmount);
    conditions.push(`(se.amount_owed_base - se.amount_repaid_base) >= $${params.length}`);
  }
  if (filters.maxAmount !== null && filters.maxAmount !== undefined) {
    params.push(filters.maxAmount);
    conditions.push(`(se.amount_owed_base - se.amount_repaid_base) <= $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(p.title ILIKE $${params.length} OR COALESCE(p.note, '') ILIKE $${params.length})`);
  }

  return { params, whereClause: `WHERE ${conditions.join(" AND ")}` };
}

export async function getDashboardSummary(username, filters = {}) {
  const currency = await getUserCurrency(username);
  const cte = buildShareAwareExpenseCte(filters);
  const totalQuery = query(
    `${cte.sql}
     SELECT ROUND(COALESCE(SUM(entries.user_share), 0)::numeric, 2) AS total_expenses
     FROM entries
     ${cte.whereClause}`,
    [username, ...cte.params]
  );

  const oweFilter = buildSharedPendingFilter(username, "owed_username", filters);
  const receivableFilter = buildSharedPendingFilter(username, "paid_username", filters);

  const oweQuery = query(
    `SELECT ROUND(COALESCE(SUM(se.amount_owed_base - se.amount_repaid_base), 0)::numeric, 2) AS total
     FROM "SHARED_EXPENSE" se
     JOIN "PAYMENT" p ON p.id = se.payment_id
     ${oweFilter.whereClause}`,
    oweFilter.params
  );

  const receivableQuery = query(
    `SELECT ROUND(COALESCE(SUM(se.amount_owed_base - se.amount_repaid_base), 0)::numeric, 2) AS total
     FROM "SHARED_EXPENSE" se
     JOIN "PAYMENT" p ON p.id = se.payment_id
     ${receivableFilter.whereClause}`,
    receivableFilter.params
  );

  const [totalResult, oweResult, receivableResult] = await Promise.all([totalQuery, oweQuery, receivableQuery]);

  const totalExpenses = Number(totalResult.rows[0]?.total_expenses || 0);
  const youOwe = Number(oweResult.rows[0]?.total || 0);
  const youAreOwed = Number(receivableResult.rows[0]?.total || 0);

  return {
    total_expenses: fromBaseCurrency(totalExpenses, currency),
    you_owe: fromBaseCurrency(youOwe, currency),
    you_are_owed: fromBaseCurrency(youAreOwed, currency),
    net_balance: fromBaseCurrency(youAreOwed - youOwe, currency),
    currency_code: currency,
  };
}
