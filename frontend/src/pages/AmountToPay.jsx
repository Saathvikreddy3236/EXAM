import { useState } from 'react';
import { CreditCard, TimerReset } from 'lucide-react';
import { useApp } from '../AppContext';
import { Panel, Pill, SectionHeader } from '../components/UI';
import { formatCurrency } from '../lib/currency';

function buildDraft(amount) {
  return {
    amount: Number(amount).toFixed(2),
    note: '',
  };
}

export default function AmountToPay() {
  const { owed, addRepayment } = useApp();
  const [drafts, setDrafts] = useState({});

  const updateDraft = (debtId, field, value, fallbackAmount) => {
    setDrafts((current) => ({
      ...current,
      [debtId]: {
        ...(current[debtId] || buildDraft(fallbackAmount)),
        [field]: value,
      },
    }));
  };

  const handleRepay = async (debt) => {
    const currentDraft = drafts[debt.id] || buildDraft(debt.amount_remaining);
    const parsedAmount = Number(currentDraft.amount);
    const remaining = Number(debt.amount_remaining);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > remaining) {
      return;
    }

    await addRepayment({
      sharedExpenseId: debt.id,
      amount: parsedAmount,
      note: currentDraft.note.trim(),
    });

    setDrafts((current) => ({
      ...current,
      [debt.id]: buildDraft(Math.max(remaining - parsedAmount, 0)),
    }));
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Amount to Pay"
        title="Outstanding balances you still need to settle."
        description="Enter the amount you just paid for each balance, whether it is a partial settlement or the final one."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {owed.map((debt) => {
          const draft = drafts[debt.id] || buildDraft(debt.amount_remaining);
          const remaining = Number(debt.amount_remaining);
          const amountValue = Number(draft.amount);
          const isAmountValid = Number.isFinite(amountValue) && amountValue > 0 && amountValue <= remaining;

          return (
            <Panel key={debt.id} className="transition duration-300 hover:-translate-y-1">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{debt.paid_fullname}</h3>
                  <p className="mt-1 text-sm text-slate-300">{debt.title}</p>
                </div>
                <div className="rounded-2xl bg-rose-400/15 p-3 text-rose-200">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pending amount</p>
                  <p className="mt-1 text-3xl font-semibold text-white">{formatCurrency(remaining, debt.currency_code)}</p>
                </div>
                <Pill tone={debt.status === 'completed' ? 'green' : 'yellow'}>{debt.status}</Pill>
              </div>

              {debt.status === 'completed' ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  This expense has already been fully settled.
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Amount paid now</label>
                    <input
                      type="number"
                      min="0"
                      max={remaining}
                      step="0.01"
                      value={draft.amount}
                      onChange={(event) => updateDraft(debt.id, 'amount', event.target.value, debt.amount_remaining)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-rose-300/60 focus:bg-white/10"
                      placeholder="0.00"
                    />
                    {!isAmountValid ? (
                      <p className="mt-2 text-xs text-rose-200">Enter an amount greater than 0 and no more than {formatCurrency(remaining, debt.currency_code)}.</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Note (optional)</label>
                    <input
                      type="text"
                      value={draft.note}
                      maxLength={200}
                      onChange={(event) => updateDraft(debt.id, 'note', event.target.value, debt.amount_remaining)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-rose-300/60 focus:bg-white/10"
                      placeholder="Added via UPI, cash, bank transfer..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRepay(debt)}
                    disabled={!isAmountValid}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <TimerReset className="h-4 w-4" />
                    Record repayment
                  </button>
                </div>
              )}
            </Panel>
          );
        })}
      </div>

      {owed.length === 0 ? (
        <Panel className="mt-5 text-center">
          <p className="text-lg font-medium text-white">All clear.</p>
          <p className="mt-2 text-sm text-slate-300">You do not have any pending amounts to pay right now.</p>
        </Panel>
      ) : null}
    </div>
  );
}
