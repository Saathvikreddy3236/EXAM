import { getBudgetsWithSpend } from "../models/budgetModel.js";
import { getDashboardSummary } from "../models/dashboardModel.js";
import { getCategories, getPaymentModes } from "../models/metaModel.js";
import { getExpenseAnalytics } from "../models/analyticsModel.js";
import { getUserCurrency } from "../models/userModel.js";
import { convertFilterAmountsToBase, normalizeExpenseFilters } from "../utils/queryFilters.js";

export async function listCategories(_req, res) {
  res.json(await getCategories());
}

export async function listPaymentModes(_req, res) {
  res.json(await getPaymentModes());
}

export async function getDashboard(req, res) {
  const filters = convertFilterAmountsToBase(normalizeExpenseFilters(req.query), await getUserCurrency(req.user.username));
  const [summary, budgets] = await Promise.all([
    getDashboardSummary(req.user.username, filters),
    getBudgetsWithSpend(req.user.username, filters),
  ]);

  res.json({
    ...summary,
    budgetWarnings: budgets,
  });
}

export async function getAnalytics(req, res) {
  const filters = convertFilterAmountsToBase(normalizeExpenseFilters(req.query), await getUserCurrency(req.user.username));
  res.json(await getExpenseAnalytics(req.user.username, filters));
}
