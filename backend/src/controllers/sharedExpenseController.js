import { getAmountsOwed, getAmountsReceivable } from "../models/sharedExpenseModel.js";

export async function getOwedExpenses(req, res) {
  res.json(await getAmountsOwed(req.user.username));
}

export async function getReceivableExpenses(req, res) {
  res.json(await getAmountsReceivable(req.user.username));
}
