import { ApiError } from "../utils/http.js";
import { addRepayment } from "../models/repaymentModel.js";
import { emitToUser } from "../socket.js";
import { buildRealtimeRepaymentPayload } from "../services/realtimeService.js";

export async function createRepayment(req, res) {
  const { sharedExpenseId, amount, date, note } = req.body;

  if (!sharedExpenseId || !amount || !date) {
    throw new ApiError(400, "sharedExpenseId, amount, and date are required.");
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "Repayment amount must be a positive number.");
  }

  if (note && String(note).length > 200) {
    throw new ApiError(400, "Repayment note cannot exceed 200 characters.");
  }

  const todayString = new Date().toLocaleDateString("en-CA");
  if (date > todayString) {
    throw new ApiError(400, "Repayment date cannot be in the future.");
  }

  try {
    const result = await addRepayment({
      sharedExpenseId,
      username: req.user.username,
      amount: numericAmount,
      date,
      note,
    });

    if (!result) {
      throw new ApiError(404, "Shared expense not found.");
    }

    const payerUsername = result.sharedExpense.owed_username;
    const receiverUsername = result.sharedExpense.paid_username;
    const baseUpdate = {
      sharedExpenseId: result.sharedExpense.id,
      paymentId: result.sharedExpense.payment_id,
      amountOwed: result.sharedExpense.amount_owed,
      amountRepaid: result.sharedExpense.amount_repaid,
      status: result.sharedExpense.status,
      paidBy: receiverUsername,
      owedBy: payerUsername,
    };

    const [payerPayload, receiverPayload] = await Promise.all([
      buildRealtimeRepaymentPayload(payerUsername, baseUpdate),
      buildRealtimeRepaymentPayload(receiverUsername, baseUpdate),
    ]);

    emitToUser(payerUsername, "repayment:updated", payerPayload);
    if (receiverUsername !== payerUsername) {
      emitToUser(receiverUsername, "repayment:updated", receiverPayload);
    }

    res.status(201).json(result);
  } catch (error) {
    if (
      error.message &&
      (error.message.includes("Cannot repay") || error.message.includes("Repayment amount"))
    ) {
      throw new ApiError(400, error.message);
    }
    throw error;
  }
}
