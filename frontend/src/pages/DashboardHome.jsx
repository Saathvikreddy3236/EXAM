import { ArrowDownRight, ArrowUpRight, BadgeIndianRupee, ReceiptText, Scale, Sparkles } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../AppContext';
import { EmptyState, ExpenseFiltersBar, Panel, Pill, SectionHeader } from '../components/UI';
import { getBudgetSignal } from '../lib/budget';
import { formatCurrency } from '../lib/currency';

const chartColors = ['#38bdf8', '#fbbf24', '#34d399', '#fb7185', '#a78bfa', '#f97316', '#22d3ee', '#c084fc'];

export default function DashboardHome() {
  const {
    dashboard,
    recentTransactions,
    budgets,
    analytics,
    user,
    isLoading,
    expenseFilters,
    setExpenseFilters,
    resetExpenseFilters,
    categories,
    paymentModes,
    getLocalDateString,
  } = useApp();
  const currency = user?.currency_preferred || dashboard?.currency_code || 'USD';

  const summaryCards = [
    { title: 'Total Expenses', value: formatCurrency(dashboard?.total_expenses || 0, currency), icon: ReceiptText, tone: 'blue', description: 'Personal spend plus your share of shared payments' },
    { title: 'You Owe', value: formatCurrency(dashboard?.you_owe || 0, currency), icon: ArrowDownRight, tone: 'red', description: 'Pending balances where you still owe someone' },
    { title: 'You Are Owed', value: formatCurrency(dashboard?.you_are_owed || 0, currency), icon: ArrowUpRight, tone: 'green', description: 'Outstanding balances others still owe you' },
    { title: 'Net Balance', value: `${Number(dashboard?.net_balance || 0) >= 0 ? '+' : '-'}${formatCurrency(Math.abs(Number(dashboard?.net_balance || 0)), currency)}`, icon: Scale, tone: Number(dashboard?.net_balance || 0) >= 0 ? 'green' : 'red', description: 'Receivable amount minus your current payables' },
  ];

  return (
    <div className="min-w-0 overflow-x-hidden">
      <SectionHeader
        eyebrow="Dashboard"
        title="Dynamic analytics for your real expense activity."
        description="Filter once and watch the summary cards, charts, recent transactions, and budget warnings update together."
        action={
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <Sparkles className="h-4 w-4 text-amber-200" />
            <span className="truncate">Signed in as {user?.username || 'guest'}</span>
          </div>
        }
      />

      <ExpenseFiltersBar
        filters={expenseFilters}
        onChange={setExpenseFilters}
        onReset={resetExpenseFilters}
        categories={categories}
        paymentModes={paymentModes}
        maxDate={getLocalDateString()}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center text-white">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
            <p className="text-sm text-slate-400">Loading filtered analytics...</p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ title, value, icon: Icon, tone, description }) => (
          <Panel key={title} className="transition duration-300 hover:-translate-y-1">
            <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
              <Pill tone={tone}>{title}</Pill>
              <div className="rounded-2xl bg-white/8 p-3 text-white">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="break-words text-2xl font-semibold text-white sm:text-3xl">{value}</div>
            <p className="mt-2 text-sm text-slate-300">{description}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel className="min-w-0">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-white">Pie Chart</h3>
            <p className="mt-1 text-sm text-slate-300">Current month category-wise expense distribution.</p>
          </div>
          {analytics?.pieChart?.length ? (
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.pieChart} dataKey="total_spent" nameKey="cat_name" innerRadius={60} outerRadius={100}>
                    {analytics.pieChart.map((entry, index) => (
                      <Cell key={entry.cat_id} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No results found" description="No current-month category data matched your filters." />
          )}
        </Panel>

        <Panel className="min-w-0">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-white">Bar Chart</h3>
            <p className="mt-1 text-sm text-slate-300">Last 6 months of spending.</p>
          </div>
          {analytics?.barChart?.length ? (
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.barChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                  <Bar dataKey="total_spent" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No results found" description="No six-month spending data matched your filters." />
          )}
        </Panel>

        <Panel className="min-w-0">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-white">Line Chart</h3>
            <p className="mt-1 text-sm text-slate-300">Current month daily spending trend.</p>
          </div>
          {analytics?.lineChart?.length ? (
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.lineChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                  <Line type="monotone" dataKey="total_spent" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#fbbf24' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No results found" description="No daily trend data matched your filters for the current month." />
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="min-w-0">
          <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-white">Recent transactions</h3>
              <p className="mt-1 text-sm text-slate-300">Latest filtered personal and shared activity.</p>
            </div>
            <Pill tone="blue">{recentTransactions.length} items</Pill>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={`${transaction.entry_type}-${transaction.ref_id}`}
                className="flex min-w-0 flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.08] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <h4 className="min-w-0 break-words font-medium text-white">{transaction.title}</h4>
                    <Pill tone={transaction.entry_type.includes('shared') || transaction.entry_type.includes('repayment') ? 'yellow' : 'default'}>
                      {transaction.cat_name}
                    </Pill>
                  </div>
                  <p className="mt-2 break-words text-sm text-slate-300">
                    {transaction.entry_type === 'shared-paid' && transaction.counterpart
                      ? `Shared with ${transaction.counterpart}`
                      : transaction.entry_type === 'shared-owed' && transaction.counterpart
                        ? `Paid by ${transaction.counterpart}`
                        : transaction.entry_type === 'repayment-paid' && transaction.counterpart
                          ? `Repayment sent to ${transaction.counterpart}`
                          : transaction.entry_type === 'repayment-received' && transaction.counterpart
                            ? `Repayment received from ${transaction.counterpart}`
                            : 'Personal expense'}
                  </p>
                </div>

                <div className="min-w-0 text-left sm:text-right">
                  <p className="break-words text-lg font-semibold text-white">{formatCurrency(transaction.user_share || transaction.amount, transaction.currency_code || currency)}</p>
                  <p className="text-sm text-slate-400">{transaction.date}</p>
                </div>
              </div>
            ))}

            {!recentTransactions.length ? <EmptyState title="No results found" description="No recent transactions matched your active filters." /> : null}
          </div>
        </Panel>

        <Panel className="min-w-0">
          <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-white">Budget warnings</h3>
              <p className="mt-1 text-sm text-slate-300">Uses your share only, with live warning indicators.</p>
            </div>
            <BadgeIndianRupee className="h-5 w-5 text-amber-200" />
          </div>

          <div className="grid gap-3">
            {budgets.map((item) => {
              const spent = Number(item.total_spent);
              const budget = Number(item.budget_amount);
              const status = getBudgetSignal(spent, budget);

              return (
                <div key={item.cat_id} className="min-w-0 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="min-w-0 break-words font-medium text-white">{item.cat_name}</span>
                    <Pill tone={status.pill}>{status.percentage.toFixed(0)}%</Pill>
                  </div>
                  <p className="mt-1 break-words text-sm text-slate-400">{formatCurrency(spent, item.currency_code || currency)} of {formatCurrency(budget, item.currency_code || currency)}</p>
                  <div className="mt-3 h-2.5 rounded-full bg-white/10">
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${status.bar}`} style={{ width: `${status.progressWidth}%` }} />
                  </div>
                  <p className={`mt-2 text-xs font-medium ${status.accent}`}>{status.label}</p>
                </div>
              );
            })}

            {!budgets.length ? <EmptyState title="No results found" description="No budget categories matched your current filters." /> : null}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel className="min-w-0">
          <h3 className="text-xl font-semibold text-white">Monthly Analysis</h3>
          <p className="mt-1 text-sm text-slate-300">Current month totals, category-wise spending, and budget progress.</p>
          <div className="mt-4 rounded-3xl bg-white/5 p-4">
            <p className="text-sm text-slate-400">Total expenses</p>
            <p className="mt-2 break-words text-2xl font-semibold text-white sm:text-3xl">{formatCurrency(analytics?.monthlyAnalysis?.total_expenses || 0, analytics?.monthlyAnalysis?.currency_code || currency)}</p>
          </div>
          <div className="mt-4 space-y-3">
            {analytics?.monthlyAnalysis?.category_totals?.map((item) => (
              <div key={item.cat_id} className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm">
                <span className="min-w-0 break-words text-slate-300">{item.cat_name}</span>
                <span className="break-words font-medium text-white">{formatCurrency(item.total_spent, item.currency_code || currency)}</span>
              </div>
            ))}
            {!analytics?.monthlyAnalysis?.category_totals?.length ? <EmptyState title="No monthly data" description="Current month analysis will appear here when matching expenses exist." /> : null}
          </div>
        </Panel>

        <Panel className="min-w-0">
          <h3 className="text-xl font-semibold text-white">Yearly Analysis</h3>
          <p className="mt-1 text-sm text-slate-300">Year total, monthly breakdown, and your highest spending category.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Yearly total</p>
              <p className="mt-2 break-words text-2xl font-semibold text-white">{formatCurrency(analytics?.yearlyAnalysis?.total_expenses || 0, analytics?.yearlyAnalysis?.currency_code || currency)}</p>
            </div>
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Highest category</p>
              <p className="mt-2 break-words text-lg font-semibold text-white">{analytics?.yearlyAnalysis?.highest_spending_category?.cat_name || 'N/A'}</p>
              <p className="mt-1 break-words text-sm text-slate-300">{analytics?.yearlyAnalysis?.highest_spending_category ? formatCurrency(analytics.yearlyAnalysis.highest_spending_category.total_spent, analytics.yearlyAnalysis.highest_spending_category.currency_code || currency) : 'No data yet'}</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {analytics?.yearlyAnalysis?.monthly_breakdown?.map((item) => (
              <div key={item.month} className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm">
                <span className="min-w-0 break-words text-slate-300">{item.month}</span>
                <span className="break-words font-medium text-white">{formatCurrency(item.total_spent, item.currency_code || currency)}</span>
              </div>
            ))}
            {!analytics?.yearlyAnalysis?.monthly_breakdown?.length ? <EmptyState title="No yearly data" description="Yearly analysis will appear here when matching expenses exist." /> : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
