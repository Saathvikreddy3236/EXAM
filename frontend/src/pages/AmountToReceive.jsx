import { HandCoins, Send } from 'lucide-react';
import { useApp } from '../AppContext';
import { Panel, Pill, SectionHeader } from '../components/UI';

export default function AmountToReceive() {
  const { receivable } = useApp();

  return (
    <div>
      <SectionHeader
        eyebrow="Amount to Receive"
        title="Pending incoming balances from your shared expenses."
        description="See who owes you, how much is still outstanding, and the current reminder status for each payment."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {receivable.map((entry) => (
          <Panel key={entry.id} className="transition duration-300 hover:-translate-y-1">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{entry.owed_fullname}</h3>
                <p className="mt-1 text-sm text-slate-300">{entry.title}</p>
              </div>
              <div className="rounded-2xl bg-emerald-300/15 p-3 text-emerald-200">
                <HandCoins className="h-5 w-5" />
              </div>
            </div>

            <div className="mb-5">
              <p className="text-sm text-slate-400">Pending amount</p>
              <p className="mt-1 text-3xl font-semibold text-white">${Number(entry.amount_remaining).toFixed(2)}</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Pill tone={entry.status === 'completed' ? 'green' : 'yellow'}>{entry.status}</Pill>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <Send className="h-4 w-4" />
                Remind
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
