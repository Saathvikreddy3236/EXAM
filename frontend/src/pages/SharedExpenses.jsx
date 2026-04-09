import { Panel, Pill, SectionHeader } from '../components/UI';
import { useApp } from '../AppContext';

function SharedList({ title, description, items, onRepay }) {
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-300">{item.cat_name}</p>
                <p className="mt-1 text-sm text-slate-400">{item.counterpart_fullname}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-lg font-semibold text-white">${Number(item.amount_remaining).toFixed(2)}</p>
                <Pill tone={item.status === 'completed' ? 'green' : 'yellow'}>{item.status}</Pill>
                {onRepay ? (
                  <button
                    type="button"
                    onClick={() => onRepay(item)}
                    disabled={item.status === 'completed'}
                    className="mt-3 rounded-2xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {item.status === 'completed' ? 'Settled' : 'Repay'}
                  </button>
                ) : null}
              </div>
            </div>
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
          onRepay={(item) => addRepayment({ sharedExpenseId: item.id, amount: Number(item.amount_remaining), note: 'Repayment from shared expense page' })}
        />
      </div>
    </div>
  );
}
