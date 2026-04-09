import { TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { Panel, Pill, SectionHeader } from '../components/UI';
import { getBudgetSignal } from '../lib/budget';

export default function Budget() {
  const { budgets, categories, saveBudget } = useApp();
  const [form, setForm] = useState({ catId: '', amount: '' });

  const budgetedCategoryIds = useMemo(
    () => new Set(budgets.map((item) => String(item.cat_id))),
    [budgets]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.catId || !form.amount) {
      return;
    }

    await saveBudget({
      catId: Number(form.catId),
      amount: Number(form.amount),
      isUpdate: budgetedCategoryIds.has(String(form.catId)),
    });

    setForm({ catId: '', amount: '' });
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Budget"
        title="Category budgets with clear spend signals."
        description="Compare each category budget against actual spending with simple visual indicators and quick trend context."
        action={
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <select
              value={form.catId}
              onChange={(event) => setForm((current) => ({ ...current, catId: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.cat_id} value={category.cat_id}>
                  {category.cat_name}
                </option>
              ))}
            </select>
            <input
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              type="number"
              min="0"
              step="0.01"
              placeholder="Budget amount"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            />
            <button type="submit" className="primary-button">
              Save Budget
            </button>
          </form>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {budgets.map((item) => {
          const spent = Number(item.total_spent);
          const budget = Number(item.budget_amount);
          const status = getBudgetSignal(spent, budget);
          const delta = budget - spent;

          return (
            <Panel key={item.cat_id}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{item.cat_name}</h3>
                  <p className="mt-1 text-sm text-slate-300">Budget tracking for this category</p>
                </div>
                <Pill tone={status.pill}>{status.label}</Pill>
              </div>

              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-400">Budget vs spent</span>
                <span className="font-medium text-white">${spent.toFixed(2)} / ${budget.toFixed(2)}</span>
              </div>

              <div className="h-3 rounded-full bg-white/10">
                <div className={`h-3 rounded-full transition-all duration-500 ${status.bar}`} style={{ width: `${status.progressWidth}%` }} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Used</p>
                  <p className="mt-2 text-lg font-semibold text-white">{status.percentage.toFixed(0)}%</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Remaining</p>
                  <p className="mt-2 text-lg font-semibold text-white">${Math.max(delta, 0)}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Signal</p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                    {delta >= 0 ? <TrendingDown className="h-4 w-4 text-emerald-300" /> : <TrendingUp className="h-4 w-4 text-rose-300" />}
                    {delta >= 0 ? 'Stable' : 'Alert'}
                  </p>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
