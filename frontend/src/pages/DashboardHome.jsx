import { ArrowDownRight, ArrowUpRight, BadgeIndianRupee, ReceiptText, Scale, Sparkles } from 'lucide-react';
import { useApp } from '../AppContext';
import { Panel, Pill, SectionHeader } from '../components/UI';
import { getBudgetSignal } from '../lib/budget';

export default function DashboardHome() {
  const { dashboard, recentTransactions, budgets, user, isLoading } = useApp();

  const summaryCards = [
    { title: 'Total Expenses', value: `$${Number(dashboard?.total_expenses || 0).toFixed(2)}`, icon: ReceiptText, tone: 'blue', description: 'Personal spend plus your share of shared payments' },
    { title: 'You Owe', value: `$${Number(dashboard?.you_owe || 0).toFixed(2)}`, icon: ArrowDownRight, tone: 'red', description: 'Pending balances where you still owe someone' },
    { title: 'You Are Owed', value: `$${Number(dashboard?.you_are_owed || 0).toFixed(2)}`, icon: ArrowUpRight, tone: 'green', description: 'Outstanding balances others still owe you' },
    { title: 'Net Balance', value: `${Number(dashboard?.net_balance || 0) >= 0 ? '+' : '-'}$${Math.abs(Number(dashboard?.net_balance || 0)).toFixed(2)}`, icon: Scale, tone: Number(dashboard?.net_balance || 0) >= 0 ? 'green' : 'red', description: 'Receivable amount minus your current payables' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center text-white">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Dashboard"
        title="Your money, splits, and recent activity at a glance."
        description="A clean overview of personal spending, shared balances, and the transactions that need your attention next."
        action={
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <Sparkles className="h-4 w-4 text-amber-200" />
            Signed in as {user?.username || 'guest'}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ title, value, icon: Icon, tone, description }) => (
          <Panel key={title} className="transition duration-300 hover:-translate-y-1">
            <div className="mb-4 flex items-start justify-between">
              <Pill tone={tone}>{title}</Pill>
              <div className="rounded-2xl bg-white/8 p-3 text-white">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-white">{value}</div>
            <p className="mt-2 text-sm text-slate-300">{description}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Recent transactions</h3>
              <p className="mt-1 text-sm text-slate-300">Latest expense activity with shared expense context.</p>
            </div>
            <Pill tone="blue">{recentTransactions.length} items</Pill>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={`${transaction.entry_type}-${transaction.ref_id}`}
                className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.08] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-white">{transaction.title}</h4>
                    <Pill tone={transaction.entry_type.includes('shared') || transaction.entry_type.includes('repayment') ? 'yellow' : 'default'}>
                      {transaction.cat_name}
                    </Pill>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
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

                <div className="text-left sm:text-right">
                  <p className="text-lg font-semibold text-white">${Number(transaction.user_share || transaction.amount).toFixed(2)}</p>
                  <p className="text-sm text-slate-400">{transaction.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Budget warnings</h3>
              <p className="mt-1 text-sm text-slate-300">Green under 60%, yellow from 60-99%, red at 100% and above.</p>
            </div>
            <BadgeIndianRupee className="h-5 w-5 text-amber-200" />
          </div>

          <div className="grid gap-3">
            {budgets.slice(0, 4).map((item) => (
              <div key={item.cat_id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                {(() => {
                  const spent = Number(item.total_spent);
                  const budget = Number(item.budget_amount);
                  const status = getBudgetSignal(spent, budget);

                  return (
                    <>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{item.cat_name}</span>
                  <Pill tone={status.pill}>{status.percentage.toFixed(0)}%</Pill>
                </div>
                <p className="mt-1 text-sm text-slate-400">${spent.toFixed(2)} of ${budget.toFixed(2)}</p>
                <div className="mt-3 h-2.5 rounded-full bg-white/10">
                  <div className={`h-2.5 rounded-full transition-all duration-500 ${status.bar}`} style={{ width: `${status.progressWidth}%` }} />
                </div>
                <p className={`mt-2 text-xs font-medium ${status.accent}`}>{status.label}</p>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
