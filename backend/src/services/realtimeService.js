import { getDashboardSummary } from "../models/dashboardModel.js";
import { getRecentTransactions, getSharedExpenseLists } from "../models/expenseModel.js";
import { getAmountsOwed, getAmountsReceivable } from "../models/sharedExpenseModel.js";

export async function buildRealtimeRepaymentPayload(username, repaymentUpdate) {
  const [dashboard, sharedExpenses, recentTransactions, owed, receivable] = await Promise.all([
    getDashboardSummary(username),
    getSharedExpenseLists(username),
    getRecentTransactions(username),
    getAmountsOwed(username),
    getAmountsReceivable(username),
  ]);

  return {
    dashboard,
    sharedExpenses,
    recentTransactions,
    owed,
    receivable,
    repaymentUpdate,
  };
}
