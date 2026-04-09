import { useState } from 'react';
import { Panel, Pill, SectionHeader } from '../components/UI';
import { useApp } from '../AppContext';

function buildDraft(amount) {
  return {
    amount: Number(amount).toFixed(2),
    note: '',
  };
}

function SharedList({ title, description, items, onRepay }) {
  const [drafts, setDrafts] = useState({});

  const updateDraft = (itemId, field, value, fallbackAmount) => {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] || buildDraft(fallbackAmount)),
        [field]: value,
      },
    }));
  };

  const handleRepay = async (item) => {
    const currentDraft = drafts[item.id] || buildDraft(item.amount_remaining);
    const parsedAmount = Number(currentDraft.amount);
    const remaining = Number(item.amount_remaining);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > remaining) {
      return;
    }

    await onRepay(item, parsedAmount, currentDraft.note.trim());

    setDrafts((current) => ({
      ...current,
      [item.id]: buildDraft(Math.max(remaining - parsedAmount, 0)),
    }));
  };

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-300">{description}</p>
        </div>
        <Pill tone="blue">{items.length} items</Pill>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            {(() => {
              const draft = drafts[item.id] || buildDraft(item.amount_remaining);
              const remaining = Number(item.amount_remaining);
              const amountValue = Number(draft.amount);
              const isAmountValid = Number.isFinite(amountValue) && amountValue > 0 && amountValue <= remaining;

              return (
                <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-300">{item.cat_name}</p>
                <p className="mt-1 text-sm text-slate-400">{item.counterpart_fullname}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-lg font-semibold text-white">${remaining.toFixed(2)}</p>
                <Pill tone={item.status === 'completed' ? 'green' : 'yellow'}>{item.status}</Pill>
                {onRepay && item.status !== 'completed' ? (
                  <div className="mt-3 space-y-3 sm:ml-auto sm:max-w-xs">
                    <input
                      type="number"
                      min="0"
                      max={remaining}
                      step="0.01"
                      value={draft.amount}
                      onChange={(event) => updateDraft(item.id, 'amount', event.target.value, item.amount_remaining)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/60 focus:bg-white/10"
                      placeholder="Amount paid"
                    />
                    <input
                      type="text"
                      maxLength={200}
                      value={draft.note}
                      onChange={(event) => updateDraft(item.id, 'note', event.target.value, item.amount_remaining)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-300/60 focus:bg-white/10"
                      placeholder="Note (optional)"
                    />
                    {!isAmountValid ? (
                      <p className="text-xs text-amber-100">Enter an amount greater than 0 and no more than ${remaining.toFixed(2)}.</p>
                    ) : null}
                  </div>
                ) : null}
                {onRepay ? (
                  <button
                    type="button"
                    onClick={() => handleRepay(item)}
                    disabled={item.status === 'completed' || !isAmountValid}
                    className="mt-3 rounded-2xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {item.status === 'completed' ? 'Settled' : 'Repay'}
                  </button>
                ) : null}
              </div>
            </div>
                </>
              );
            })()}
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function SharedExpenses() {
  const { sharedExpenses, addRepayment } = useApp();

  return (
    <div>
      <SectionHeader
        eyebrow="Shared Expenses"
        title="Track the shared expenses you paid and the ones you owe."
        description="This page separates group expenses into payments you funded and balances where you are one of the participants."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <SharedList
          title="Paid by you"
          description="Shared payments you created for other participants."
          items={sharedExpenses.paidByYou}
        />
        <SharedList
          title="Owed by you"
          description="Shared expense entries where someone else covered the payment."
          items={sharedExpenses.owedByYou}
          onRepay={(item, amount, note) => addRepayment({ sharedExpenseId: item.id, amount, note })}
        />
      </div>
    </div>
  );
}
