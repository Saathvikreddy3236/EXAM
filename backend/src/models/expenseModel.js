import { withTransaction, query } from "../db.js";

function buildPersonalExpenseFilters(filters, params, aliases = { payment: "p" }) {
  const conditions = [];
  const p = aliases.payment;

  if (filters.categoryId) {
    params.push(filters.categoryId);
    conditions.push(`${p}.cat_id = $${params.length}`);
  }

  if (filters.modeId) {
    params.push(filters.modeId);
    conditions.push(`${p}.mode_id = $${params.length}`);
  }

  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`${p}.date >= $${params.length}`);
  }

  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`${p}.date <= $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`${p}.title ILIKE $${params.length}`);
  }

  return conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : "";
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
    const paymentResult = await client.query(
      `INSERT INTO "PAYMENT" (title, amount, cat_id, date, mode_id, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, amount, catId, date, modeId, note || null]
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
      const sharedResult = await client.query(
        `INSERT INTO "SHARED_EXPENSE"
          (paid_username, owed_username, payment_id, amount_owed, amount_repaid, status)
         VALUES ($1, $2, $3, $4, 0, 'pending')
         RETURNING *`,
        [username, participant.username, payment.id, participant.amount]
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

export async function getPersonalExpenses(username, filters = {}) {
  const params = [username];
  const whereFilters = buildPersonalExpenseFilters(filters, params);

  const result = await query(
    `SELECT
        e.id,
        e.payment_id,
        p.title,
        p.amount,
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
      ORDER BY p.date DESC, e.id DESC`,
    params
  );

  return result.rows;
}

export async function getRecentTransactions(username) {
  const result = await query(
    `SELECT * FROM (
        SELECT
          e.id AS ref_id,
          p.id AS payment_id,
          p.title,
          p.date,
          p.amount,
          c.cat_name,
          pm.mode_name,
          'personal' AS entry_type,
          NULL::varchar AS counterpart,
          p.amount AS user_share
        FROM "EXPENSE" e
        JOIN "PAYMENT" p ON p.id = e.payment_id
        JOIN "CATEGORY" c ON c.cat_id = p.cat_id
        JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
        WHERE e.username = $1

        UNION ALL

        SELECT
          p.id AS ref_id,
          p.id AS payment_id,
          p.title,
          p.date,
          p.amount,
          c.cat_name,
          pm.mode_name,
          'shared-paid' AS entry_type,
          NULL::varchar AS counterpart,
          p.amount - COALESCE(sum_rows.total_owed, 0) AS user_share
        FROM "PAYMENT" p
        JOIN (
          SELECT payment_id, paid_username, SUM(amount_owed) AS total_owed
          FROM "SHARED_EXPENSE"
          GROUP BY payment_id, paid_username
        ) sum_rows ON sum_rows.payment_id = p.id
        JOIN "CATEGORY" c ON c.cat_id = p.cat_id
        JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
        WHERE sum_rows.paid_username = $1

        UNION ALL

        SELECT
          se.id AS ref_id,
          p.id AS payment_id,
          p.title,
          p.date,
          p.amount,
          c.cat_name,
          pm.mode_name,
          'shared-owed' AS entry_type,
          se.paid_username AS counterpart,
          se.amount_owed AS user_share
        FROM "SHARED_EXPENSE" se
        JOIN "PAYMENT" p ON p.id = se.payment_id
        JOIN "CATEGORY" c ON c.cat_id = p.cat_id
        JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
        WHERE se.owed_username = $1
      ) recent
      ORDER BY date DESC, payment_id DESC
      LIMIT 5`,
    [username]
  );

  return result.rows;
}

export async function updatePersonalExpense(username, expenseId, payload) {
  const result = await query(
    `UPDATE "PAYMENT" p
      SET title = $3,
         amount = $4,
         cat_id = $5,
         date = $6,
         mode_id = $7,
         note = $8
     FROM "EXPENSE" e
     WHERE e.id = $2
       AND e.username = $1
       AND e.payment_id = p.id
     RETURNING e.id, p.id AS payment_id, p.title, p.amount, p.cat_id, p.date, p.mode_id, p.note`,
    [
      username,
      expenseId,
      payload.title,
      payload.amount,
      payload.catId,
      payload.date,
      payload.modeId,
      payload.note || null,
    ]
  );

  return result.rows[0] || null;
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

export async function getSharedExpenseLists(username) {
  const paidRows = await query(
    `SELECT
        se.id,
        se.payment_id,
        p.title,
        p.amount AS payment_amount,
        p.date,
        c.cat_name,
        pm.mode_name,
        se.owed_username AS counterpart_username,
        u.fullname AS counterpart_fullname,
        se.amount_owed,
        se.amount_repaid,
        se.status,
        ROUND((se.amount_owed - se.amount_repaid)::numeric, 2) AS amount_remaining
      FROM "SHARED_EXPENSE" se
      JOIN "PAYMENT" p ON p.id = se.payment_id
      JOIN "CATEGORY" c ON c.cat_id = p.cat_id
      JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
      JOIN "USER" u ON u.username = se.owed_username
      WHERE se.paid_username = $1
      ORDER BY p.date DESC, se.id DESC`,
    [username]
  );

  const owedRows = await query(
    `SELECT
        se.id,
        se.payment_id,
        p.title,
        p.amount AS payment_amount,
        p.date,
        c.cat_name,
        pm.mode_name,
        se.paid_username AS counterpart_username,
        u.fullname AS counterpart_fullname,
        se.amount_owed,
        se.amount_repaid,
        se.status,
        ROUND((se.amount_owed - se.amount_repaid)::numeric, 2) AS amount_remaining
      FROM "SHARED_EXPENSE" se
      JOIN "PAYMENT" p ON p.id = se.payment_id
      JOIN "CATEGORY" c ON c.cat_id = p.cat_id
      JOIN "PAYMENT_MODE" pm ON pm.mode_id = p.mode_id
      JOIN "USER" u ON u.username = se.paid_username
      WHERE se.owed_username = $1
      ORDER BY p.date DESC, se.id DESC`,
    [username]
  );

  return {
    paidByYou: paidRows.rows,
    owedByYou: owedRows.rows,
  };
}
