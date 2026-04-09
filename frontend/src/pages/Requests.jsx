import { Check, ShieldX } from 'lucide-react';
import { useApp } from '../AppContext';
import { Panel, Pill, SectionHeader } from '../components/UI';

export default function Requests() {
  const { friendRequests, acceptFriendRequest, rejectFriendRequest } = useApp();

  return (
    <div>
      <SectionHeader
        eyebrow="Requests"
        title="Incoming friend requests that need your answer."
        description="Review incoming friend requests and quickly accept or reject. Accepting allows you to create shared expenses together."
      />

      <div className="space-y-5">
        {friendRequests.map((request) => (
          <Panel key={request.id}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-white">{request.fullname}</h3>
                  <Pill tone="blue">@{request.sender_username}</Pill>
                </div>
                <p className="mt-1 text-sm text-slate-300">{request.email}</p>
                <p className="mt-3 text-sm text-slate-400">{request.created_at || 'Just now'}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => acceptFriendRequest(request.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
                >
                  <Check className="h-4 w-4" />
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => rejectFriendRequest(request.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <ShieldX className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {friendRequests.length === 0 ? (
        <Panel className="mt-5 text-center">
          <p className="text-lg font-medium text-white">No pending requests.</p>
          <p className="mt-2 text-sm text-slate-300">You have cleared everything in your request inbox.</p>
        </Panel>
      ) : null}
    </div>
  );
}
