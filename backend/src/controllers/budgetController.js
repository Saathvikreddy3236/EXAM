import { ApiError } from "../utils/http.js";
import { getBudgetsWithSpend, upsertBudget } from "../models/budgetModel.js";
import { getUserCurrency } from "../models/userModel.js";
import { convertFilterAmountsToBase, normalizeExpenseFilters } from "../utils/queryFilters.js";

export async function addBudget(req, res) {
  const { catId, amount } = req.body;

  if (!catId || amount === undefined) {
    throw new ApiError(400, "catId and amount are required.");
  }

  // MEDIUM FIX: Validate budget amount is positive
  if (Number(amount) <= 0) {
    throw new ApiError(400, "Budget amount must be greater than zero.");
  }

  const budget = await upsertBudget(req.user.username, catId, amount);
  res.status(201).json(budget);
}

export async function getAllBudgets(req, res) {
  const filters = convertFilterAmountsToBase(normalizeExpenseFilters(req.query), await getUserCurrency(req.user.username));
  res.json(await getBudgetsWithSpend(req.user.username, filters));
}

export async function updateBudget(req, res) {
  const { catId, amount } = req.body;

  if (!catId || amount === undefined) {
    throw new ApiError(400, "catId and amount are required.");
  }

  const budget = await upsertBudget(req.user.username, catId, amount);
  res.json(budget);
}
