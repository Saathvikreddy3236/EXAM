import { withTransaction } from "../db.js";

export async function addRepayment({
  sharedExpenseId,
  username,
  amount,
  date,
  note,
}) {
  return withTransaction(async (client) => {
    const sharedResult = await client.query(
      `SELECT * FROM "SHARED_EXPENSE" WHERE id = $1 AND owed_username = $2`,
      [sharedExpenseId, username]
    );

    const sharedExpense = sharedResult.rows[0];
    if (!sharedExpense) {
      return null;
    }

    // CRITICAL FIX: Validate repayment amount to prevent overpayment
    const remaining = Number(sharedExpense.amount_owed) - Number(sharedExpense.amount_repaid);
    if (amount <= 0) {
      throw new Error("Repayment amount must be positive.");
    }
    if (amount > remaining) {
      throw new Error(`Cannot repay $${amount.toFixed(2)}. Only $${remaining.toFixed(2)} remains due.`);
    }

    const updatedAmount = Number(sharedExpense.amount_repaid) + Number(amount);
    const status =
      updatedAmount >= Number(sharedExpense.amount_owed) ? "completed" : "pending";

    const repaymentResult = await client.query(
      `INSERT INTO "REPAYMENTS" (shared_expense_id, amount, date, note)
       VALUES ($1, $2, $3, $4)
       RETURNING id, shared_expense_id, amount, date, note`,
      [sharedExpenseId, amount, date, note || null]
    );

    const sharedUpdateResult = await client.query(
      `UPDATE "SHARED_EXPENSE"
       SET amount_repaid = $2, status = $3
       WHERE id = $1
       RETURNING id, paid_username, owed_username, payment_id, amount_owed, amount_repaid, status`,
      [sharedExpenseId, updatedAmount, status]
    );

    return {
      repayment: repaymentResult.rows[0],
      sharedExpense: sharedUpdateResult.rows[0],
    };
  });
}
