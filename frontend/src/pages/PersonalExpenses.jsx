import { Download, PencilLine, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../AppContext';
import { EmptyState, ExpenseFiltersBar, Panel, SectionHeader } from '../components/UI';
import { formatCurrency } from '../lib/currency';

const initialFormWithNote = { title: '', amount: '', catId: '', date: '', modeId: '', note: '' };

export default function PersonalExpenses() {
  const {
    personalExpenses,
    categories,
    paymentModes,
    updateExpense,
    deleteExpense,
    exportCsv,
    expenseFilters,
    setExpenseFilters,
    resetExpenseFilters,
    personalSort,
    setPersonalSort,
    getLocalDateString,
    isLoading,
  } = useApp();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialFormWithNote);

  const startEdit = (expense) => {
    setEditing(expense.id);
    setForm({
      title: expense.title,
      amount: expense.amount,
      catId: expense.cat_id,
      date: expense.date,
      modeId: expense.mode_id,
      note: expense.note || '',
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    await updateExpense(editing, {
      title: form.title,
      amount: Number(form.amount),
      catId: Number(form.catId),
      date: form.date,
      modeId: Number(form.modeId),
      note: form.note,
    });
    setEditing(null);
    setForm(initialFormWithNote);
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Personal Expenses"
        title="Filter, edit, and remove your personal expense records."
        description="Use combined filters and sorting to explore your real personal expense history."
      />

      <ExpenseFiltersBar
        filters={expenseFilters}
        onChange={setExpenseFilters}
        onReset={resetExpenseFilters}
        categories={categories}
        paymentModes={paymentModes}
        maxDate={getLocalDateString()}
        sort={personalSort}
        onSortChange={setPersonalSort}
        extraAction={
          <button type="button" onClick={exportCsv} className="primary-button">
            <Download className="h-4 w-4" />
            Export to CSV
          </button>
        }
      />

      {editing ? (
        <Panel className="mb-6">
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} type="number" step="0.01" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <select value={form.catId} onChange={(event) => setForm((current) => ({ ...current, catId: event.target.value }))} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
              {categories.map((category) => <option key={category.cat_id} value={category.cat_id}>{category.cat_name}</option>)}
            </select>
            <select value={form.modeId} onChange={(event) => setForm((current) => ({ ...current, modeId: event.target.value }))} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
              {paymentModes.map((mode) => <option key={mode.mode_id} value={mode.mode_id}>{mode.mode_name}</option>)}
            </select>
            <input value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} type="date" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <textarea value={form.note} maxLength={200} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value.slice(0, 200) }))} rows="3" placeholder="Optional note" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none lg:col-span-5" />
            <button type="submit" className="primary-button lg:col-span-2">Save Changes</button>
            <button type="button" onClick={() => { setEditing(null); setForm(initialFormWithNote); }} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:col-span-2">Cancel</button>
          </form>
        </Panel>
      ) : null}

      <Panel>
        {isLoading ? <p className="text-sm text-slate-400">Loading filtered expenses...</p> : null}

        <div className="space-y-3">
          {personalExpenses.map((expense) => (
            <div key={expense.id} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-medium text-white">{expense.title}</p>
                <p className="mt-1 text-sm text-slate-300">{expense.cat_name} via {expense.mode_name}</p>
                <p className="mt-1 text-sm text-slate-400">{expense.date}</p>
                {expense.note ? <p className="mt-1 text-sm text-slate-400">{expense.note}</p> : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-white">{formatCurrency(expense.amount, expense.currency_code)}</span>
                <button type="button" onClick={() => startEdit(expense)} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white transition hover:bg-white/10">
                  <PencilLine className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => deleteExpense(expense.id)} className="rounded-2xl bg-rose-400 p-3 text-slate-950 transition hover:bg-rose-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {personalExpenses.length === 0 && !isLoading ? (
            <EmptyState
              title="No results found"
              description="Try adjusting your filters, search, or sorting to see more personal expenses."
            />
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
