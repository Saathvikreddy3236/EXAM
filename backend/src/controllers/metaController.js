import { getBudgetsWithSpend } from "../models/budgetModel.js";
import { getDashboardSummary } from "../models/dashboardModel.js";
import { getCategories, getPaymentModes } from "../models/metaModel.js";

export async function listCategories(_req, res) {
  res.json(await getCategories());
}

export async function listPaymentModes(_req, res) {
  res.json(await getPaymentModes());
}

export async function getDashboard(req, res) {
  const [summary, budgets] = await Promise.all([
    getDashboardSummary(req.user.username),
    getBudgetsWithSpend(req.user.username),
  ]);

  res.json({
    ...summary,
    budgetWarnings: budgets,
  });
}
