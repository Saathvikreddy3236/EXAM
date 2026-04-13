import { withTransaction, query } from "../db.js";
import { fromBaseCurrency, normalizeCurrency, toBaseCurrency } from "../utils/currency.js";
import { findUserByUsername, getUserCurrency } from "./userModel.js";

function buildPersonalExpenseFilters(filters, params, aliases = { payment: "p" }) {
  const conditions = [];
  const p = aliases.payment;

  if (filters.categoryIds?.length) {
    params.push(filters.categoryIds);
    conditions.push(`${p}.cat_id = ANY($${params.length})`);
  }

  if (filters.modeIds?.length) {
    params.push(filters.modeIds);
    conditions.push(`${p}.mode_id = ANY($${params.length})`);
  }

  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`${p}.date >= $${params.length}`);
  }

  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`${p}.date <= $${params.length}`);
  }

  if (filters.minAmount !== null && filters.minAmount !== undefined) {
    params.push(filters.minAmount);
    conditions.push(`${p}.amount_base >= $${params.length}`);
  }

  if (filters.maxAmount !== null && filters.maxAmount !== undefined) {
    params.push(filters.maxAmount);
    conditions.push(`${p}.amount_base <= $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(${p}.title ILIKE $${params.length} OR COALESCE(${p}.note, '') ILIKE $${params.length})`);
  }

  return conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : "";
}

function buildSharedExpenseFilters(filters, params, aliases = { payment: "p", shared: "se" }) {
  const conditions = [];
  const p = aliases.payment;
  const s = aliases.shared;

  if (filters.categoryIds?.length) {
    params.push(filters.categoryIds);
    conditions.push(`${p}.cat_id = ANY($${params.length})`);
  }

  if (filters.modeIds?.length) {
    params.push(filters.modeIds);
    conditions.push(`${p}.mode_id = ANY($${params.length})`);
  }

  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`${p}.date >= $${params.length}`);
  }

  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`${p}.date <= $${params.length}`);
  }

  if (filters.minAmount !== null && filters.minAmount !== undefined) {
    params.push(filters.minAmount);
    conditions.push(`${s}.amount_owed_base >= $${params.length}`);
  }

  if (filters.maxAmount !== null && filters.maxAmount !== undefined) {
    params.push(filters.maxAmount);
    conditions.push(`${s}.amount_owed_base <= $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(${p}.title ILIKE $${params.length} OR COALESCE(${p}.note, '') ILIKE $${params.length})`);
  }

  return conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : "";
}

function buildSortClause(sort = {}, aliases = { payment: "p", shared: "se" }, defaultDateField = "date") {
  const sortBy = sort.sortBy === "amount" ? "amount" : "date";
  const sortOrder = sort.sortOrder === "asc" ? "ASC" : "DESC";
  const p = aliases.payment;
  const s = aliases.shared;

  if (sortBy === "amount") {
    return `ORDER BY ${s ? `${s}.amount_owed_base` : `${p}.amount_base`} ${sortOrder}, ${p}.${defaultDateField} DESC`;
  }

  return `ORDER BY ${p}.${defaultDateField} ${sortOrder}, ${s ? `${s}.id DESC` : "e.id DESC"}`;
}

export async function createExpense({
  username,
  title,
  amount,
  catId,
  date,
  modeId,
  note,
  isShared,
  splitType,
  participants,
}) {
  return withTransaction(async (client) => {
    const payer = await findUserByUsername(username);
    const payerCurrency = normalizeCurrency(payer?.currency_preferred);
    const paymentAmountBase = toBaseCurrency(amount, payerCurrency);

    const paymentResult = await client.query(
      `INSERT INTO "PAYMENT" (title, amount, amount_base, currency_code, cat_id, date, mode_id, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, amount, paymentAmountBase, payerCurrency, catId, date, modeId, note || null]
    );

    const payment = paymentResult.rows[0];

    if (!isShared) {
      const expenseResult = await client.query(
        `INSERT INTO "EXPENSE" (username, payment_id)
         VALUES ($1, $2)
         RETURNING id`,
        [username, payment.id]
      );

      return {
        type: "personal",
        payment,
        expenseId: expenseResult.rows[0].id,
      };
    }

    const inserts = [];
    for (const participant of participants) {
      const participantCurrency = normalizeCurrency((await findUserByUsername(participant.username))?.currency_preferred);
      const owedBase = toBaseCurrency(participant.amount, payerCurrency);
      const owedDisplay = fromBaseCurrency(owedBase, participantCurrency);
      const sharedResult = await client.query(
        `INSERT INTO "SHARED_EXPENSE"
          (paid_username, owed_username, payment_id, amount_owed, amount_owed_base, amount_repaid, amount_repaid_base, status)
         VALUES ($1, $2, $3, $4, $5, 0, 0, 'pending')
         RETURNING *`,
        [username, participant.username, payment.id, owedDisplay, owedBase]
      );
      inserts.push(sharedResult.rows[0]);
    }

    return {
      type: "shared",
      payment,
      splitType,
      sharedExpenses: inserts,
    };
  });
}

function convertPaymentRow(row, currency) {
  return {
    ...row,
    amount: fromBaseCurrency(row.amount_base ?? row.amount, currency),
    currency_code: currency,
  };
}

export async function getPersonalExpenses(username, filters = {}, sort = {}) {
  const currency = await getUserCurrency(username);
  const params = [username];
  const whereFilters = buildPersonalExpenseFilters(filters, params);

  const result = await query(
    `SELECT
        e.id,
        e.payment_id,
        p.title,
        p.amount,
        p.amount_base,
        p.currency_code,
        p.date,
        p.note,
        c.cat_id,
        c.cat_name,
        pm.mode_id,
        pm.mode_name
      FROM "EXPENSE" e
      JOIN "PAYMENT" p ON p.id = e.payment_id
      JOIN "CATEGORY" c ON c.cat_id = p.cat_id
      JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
      WHERE e.username = $1 ${whereFilters}
      ${buildSortClause(sort, { payment: "p", shared: null })}`,
    params
  );

  return result.rows.map((row) => convertPaymentRow(row, currency));
}

export async function getRecentTransactions(username, filters = {}) {
  const currency = await getUserCurrency(username);
  const params = [username];
  const recentFilters = buildPersonalExpenseFilters(filters, params, { payment: "p" });
  const result = await query(
    `SELECT * FROM (
        SELECT
          e.id AS ref_id,
          p.id AS payment_id,
          p.title,
          p.date,
          p.amount,
          p.amount_base,
          c.cat_name,
          pm.mode_name,
          'personal' AS entry_type,
          NULL::varchar AS counterpart,
          p.amount_base AS user_share_base
        FROM "EXPENSE" e
        JOIN "PAYMENT" p ON p.id = e.payment_id
        JOIN "CATEGORY" c ON c.cat_id = p.cat_id
        JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
        WHERE e.username = $1 ${recentFilters}

        UNION ALL

        SELECT
          p.id AS ref_id,
          p.id AS payment_id,
          p.title,
          p.date,
          p.amount,
          p.amount_base,
          c.cat_name,
          pm.mode_name,
          'shared-paid' AS entry_type,
          NULL::varchar AS counterpart,
          p.amount_base - COALESCE(sum_rows.total_owed_base, 0) AS user_share_base
        FROM "PAYMENT" p
        JOIN (
          SELECT payment_id, paid_username, SUM(amount_owed_base) AS total_owed_base
          FROM "SHARED_EXPENSE"
          GROUP BY payment_id, paid_username
        ) sum_rows ON sum_rows.payment_id = p.id
        JOIN "CATEGORY" c ON c.cat_id = p.cat_id
        JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
        WHERE sum_rows.paid_username = $1 ${recentFilters}

        UNION ALL

        SELECT
          se.id AS ref_id,
          p.id AS payment_id,
          p.title,
          p.date,
          p.amount,
          p.amount_base,
          c.cat_name,
          pm.mode_name,
          'shared-owed' AS entry_type,
          se.paid_username AS counterpart,
          se.amount_owed_base AS user_share_base
        FROM "SHARED_EXPENSE" se
        JOIN "PAYMENT" p ON p.id = se.payment_id
        JOIN "CATEGORY" c ON c.cat_id = p.cat_id
        JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
        WHERE se.owed_username = $1 ${recentFilters}

        UNION ALL

        SELECT
          r.id AS ref_id,
          p.id AS payment_id,
          CONCAT(p.title, ' repayment') AS title,
          r.date,
          r.amount,
          r.amount_base AS amount_base,
          c.cat_name,
          pm.mode_name,
          'repayment-paid' AS entry_type,
          se.paid_username AS counterpart,
          r.amount_base AS user_share_base
        FROM "REPAYMENTS" r
        JOIN "SHARED_EXPENSE" se ON se.id = r.shared_expense_id
        JOIN "PAYMENT" p ON p.id = se.payment_id
        JOIN "CATEGORY" c ON c.cat_id = p.cat_id
        JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
        WHERE se.owed_username = $1 ${recentFilters}

        UNION ALL

        SELECT
          r.id AS ref_id,
          p.id AS payment_id,
          CONCAT(p.title, ' repayment') AS title,
          r.date,
          r.amount,
          r.amount_base AS amount_base,
          c.cat_name,
          pm.mode_name,
          'repayment-received' AS entry_type,
          se.owed_username AS counterpart,
          r.amount_base AS user_share_base
        FROM "REPAYMENTS" r
        JOIN "SHARED_EXPENSE" se ON se.id = r.shared_expense_id
        JOIN "PAYMENT" p ON p.id = se.payment_id
        JOIN "CATEGORY" c ON c.cat_id = p.cat_id
        JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
        WHERE se.paid_username = $1 ${recentFilters}
      ) recent
      ORDER BY date DESC, payment_id DESC
      LIMIT 5`,
    params
  );

  return result.rows.map((row) => ({
    ...row,
    amount: fromBaseCurrency(row.amount_base ?? row.amount, currency),
    user_share: fromBaseCurrency(row.user_share_base ?? row.amount_base ?? row.amount, currency),
    currency_code: currency,
  }));
}

export async function updatePersonalExpense(username, expenseId, payload) {
  const currency = await getUserCurrency(username);
  const amountBase = toBaseCurrency(payload.amount, currency);
  const result = await query(
    `UPDATE "PAYMENT" p
      SET title = $3,
         amount = $4,
         amount_base = $5,
         currency_code = $6,
         cat_id = $7,
         date = $8,
         mode_id = $9,
         note = $10
     FROM "EXPENSE" e
     WHERE e.id = $2
       AND e.username = $1
       AND e.payment_id = p.id
     RETURNING e.id, p.id AS payment_id, p.title, p.amount, p.amount_base, p.currency_code, p.cat_id, p.date, p.mode_id, p.note`,
    [
      username,
      expenseId,
      payload.title,
      payload.amount,
      amountBase,
      currency,
      payload.catId,
      payload.date,
      payload.modeId,
      payload.note || null,
    ]
  );

  return result.rows[0] ? convertPaymentRow(result.rows[0], currency) : null;
}

export async function deletePersonalExpense(username, expenseId) {
  return withTransaction(async (client) => {
    const result = await client.query(
      `SELECT payment_id FROM "EXPENSE" WHERE id = $1 AND username = $2`,
      [expenseId, username]
    );

    const expense = result.rows[0];
    if (!expense) {
      return false;
    }

    await client.query(`DELETE FROM "EXPENSE" WHERE id = $1 AND username = $2`, [
      expenseId,
      username,
    ]);
    await client.query(`DELETE FROM "PAYMENT" WHERE id = $1`, [expense.payment_id]);
    return true;
  });
}

export async function getSharedExpenseLists(username, filters = {}, sort = {}) {
  const currency = await getUserCurrency(username);
  const paidParams = [username];
  const paidFilters = buildSharedExpenseFilters(filters, paidParams, { payment: "p", shared: "se" });
  const paidRows = await query(
    `SELECT
        se.id,
        se.payment_id,
        p.title,
        p.amount AS payment_amount,
        p.amount_base AS payment_amount_base,
        p.date,
        c.cat_name,
        pm.mode_name,
        se.owed_username AS counterpart_username,
        u.fullname AS counterpart_fullname,
        se.amount_owed,
        se.amount_owed_base,
        se.amount_repaid,
        se.amount_repaid_base,
        se.status,
        ROUND((se.amount_owed_base - se.amount_repaid_base)::numeric, 2) AS amount_remaining_base
      FROM "SHARED_EXPENSE" se
      JOIN "PAYMENT" p ON p.id = se.payment_id
      JOIN "CATEGORY" c ON c.cat_id = p.cat_id
      JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
      JOIN "USER" u ON u.username = se.owed_username
      WHERE se.paid_username = $1 ${paidFilters}
      ${buildSortClause(sort, { payment: "p", shared: "se" })}`,
    paidParams
  );

  const owedParams = [username];
  const owedFilters = buildSharedExpenseFilters(filters, owedParams, { payment: "p", shared: "se" });
  const owedRows = await query(
    `SELECT
        se.id,
        se.payment_id,
        p.title,
        p.amount AS payment_amount,
        p.amount_base AS payment_amount_base,
        p.date,
        c.cat_name,
        pm.mode_name,
        se.paid_username AS counterpart_username,
        u.fullname AS counterpart_fullname,
        se.amount_owed,
        se.amount_owed_base,
        se.amount_repaid,
        se.amount_repaid_base,
        se.status,
        ROUND((se.amount_owed_base - se.amount_repaid_base)::numeric, 2) AS amount_remaining_base
      FROM "SHARED_EXPENSE" se
      JOIN "PAYMENT" p ON p.id = se.payment_id
      JOIN "CATEGORY" c ON c.cat_id = p.cat_id
      JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
      JOIN "USER" u ON u.username = se.paid_username
      WHERE se.owed_username = $1 ${owedFilters}
      ${buildSortClause(sort, { payment: "p", shared: "se" })}`,
    owedParams
  );

  return {
    paidByYou: paidRows.rows.map((row) => ({
      ...row,
      payment_amount: fromBaseCurrency(row.payment_amount_base ?? row.payment_amount, currency),
      amount_owed: fromBaseCurrency(row.amount_owed_base ?? row.amount_owed, currency),
      amount_repaid: fromBaseCurrency(row.amount_repaid_base ?? row.amount_repaid, currency),
      amount_remaining: fromBaseCurrency(row.amount_remaining_base ?? 0, currency),
      currency_code: currency,
    })),
    owedByYou: owedRows.rows.map((row) => ({
      ...row,
      payment_amount: fromBaseCurrency(row.payment_amount_base ?? row.payment_amount, currency),
      amount_owed: fromBaseCurrency(row.amount_owed_base ?? row.amount_owed, currency),
      amount_repaid: fromBaseCurrency(row.amount_repaid_base ?? row.amount_repaid, currency),
      amount_remaining: fromBaseCurrency(row.amount_remaining_base ?? 0, currency),
      currency_code: currency,
    })),
  };
}
