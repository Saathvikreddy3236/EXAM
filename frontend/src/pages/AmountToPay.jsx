import { CreditCard, TimerReset } from 'lucide-react';
import { useApp } from '../AppContext';
import { Panel, Pill, SectionHeader } from '../components/UI';

export default function AmountToPay() {
  const { owed, addRepayment } = useApp();

  return (
    <div>
      <SectionHeader
        eyebrow="Amount to Pay"
        title="Outstanding balances you still need to settle."
        description="A focused view of debts you owe, who they belong to, and quick actions to mark them as paid."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {owed.map((debt) => (
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
                <p className="mt-1 text-3xl font-semibold text-white">${Number(debt.amount_remaining).toFixed(2)}</p>
              </div>
              <Pill tone={debt.status === 'completed' ? 'green' : 'yellow'}>{debt.status}</Pill>
            </div>

            <button
              type="button"
              onClick={() => addRepayment({ sharedExpenseId: debt.id, amount: Number(debt.amount_remaining), note: 'Full repayment' })}
              disabled={debt.status === 'completed'}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <TimerReset className="h-4 w-4" />
              {debt.status === 'completed' ? 'Settled' : 'Repay'}
            </button>
          </Panel>
        ))}
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
