import { withTransaction } from "../db.js";
import { fromBaseCurrency, toBaseCurrency } from "../utils/currency.js";
import { getUserCurrency } from "./userModel.js";

export async function addRepayment({
  sharedExpenseId,
  username,
  amount,
  date,
  note,
}) {
  return withTransaction(async (client) => {
    const userCurrency = await getUserCurrency(username);
    const amountBase = toBaseCurrency(amount, userCurrency);
    const sharedResult = await client.query(
      `SELECT * FROM "SHARED_EXPENSE" WHERE id = $1 AND owed_username = $2`,
      [sharedExpenseId, username]
    );

    const sharedExpense = sharedResult.rows[0];
    if (!sharedExpense) {
      return null;
    }

    // CRITICAL FIX: Validate repayment amount to prevent overpayment
    const remainingBase = Number(sharedExpense.amount_owed_base ?? sharedExpense.amount_owed) - Number(sharedExpense.amount_repaid_base ?? sharedExpense.amount_repaid);
    if (amount <= 0) {
      throw new Error("Repayment amount must be positive.");
    }
    if (amountBase > remainingBase) {
      const remainingDisplay = fromBaseCurrency(remainingBase, userCurrency);
      throw new Error(`Cannot repay ${amount.toFixed(2)}. Only ${remainingDisplay.toFixed(2)} remains due.`);
    }

    const updatedAmountBase = Number(sharedExpense.amount_repaid_base ?? sharedExpense.amount_repaid) + Number(amountBase);
    const status =
      updatedAmountBase >= Number(sharedExpense.amount_owed_base ?? sharedExpense.amount_owed) ? "completed" : "pending";

    const repaymentResult = await client.query(
      `INSERT INTO "REPAYMENTS" (shared_expense_id, amount, amount_base, currency_code, date, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, shared_expense_id, amount, amount_base, currency_code, date, note`,
      [sharedExpenseId, amount, amountBase, userCurrency, date, note || null]
    );

    const sharedUpdateResult = await client.query(
      `UPDATE "SHARED_EXPENSE"
       SET amount_repaid = $2, amount_repaid_base = $3, status = $4
       WHERE id = $1
       RETURNING id, paid_username, owed_username, payment_id, amount_owed, amount_owed_base, amount_repaid, amount_repaid_base, status`,
      [sharedExpenseId, updatedAmountBase, updatedAmountBase, status]
    );

    return {
      repayment: repaymentResult.rows[0],
      sharedExpense: sharedUpdateResult.rows[0],
    };
  });
}
