import { Check, ShieldX, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../AppContext';
import { Panel, Pill, SectionHeader } from '../components/UI';

export default function Friends() {
  const { friends, friendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useApp();
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await sendFriendRequest(username);
      setMessage('Friend request sent.');
      setUsername('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not send request.');
    }
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Friends"
        title="Your network and incoming friend requests."
        description="Send a request by username, review incoming requests, and keep your shared-expense circle organized."
        action={
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Friend username"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            />
            <button type="submit" className="primary-button">
              <UserPlus className="h-4 w-4" />
              Send Request
            </button>
          </form>
        }
      />

      {message ? <p className="mb-5 text-sm text-slate-300">{message}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Incoming requests</h3>
            <Pill tone="blue">{friendRequests.length} pending</Pill>
          </div>

          <div className="space-y-3">
            {friendRequests.map((request) => (
              <div key={request.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{request.fullname}</p>
                    <p className="mt-1 text-sm text-slate-300">@{request.sender_username}</p>
                    <p className="mt-1 text-sm text-slate-400">{request.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => acceptFriendRequest(request.id)}
                      className="rounded-2xl bg-emerald-300 p-3 text-slate-950 transition hover:bg-emerald-200"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectFriendRequest(request.id)}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white transition hover:bg-white/10"
                    >
                      <ShieldX className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {friendRequests.length === 0 ? (
              <p className="text-sm text-slate-400">No pending friend requests.</p>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Friends list</h3>
            <Pill tone="green">{friends.length} friends</Pill>
          </div>

          <div className="grid gap-3">
            {friends.map((friend) => (
              <div key={friend.username} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">{friend.fullname}</p>
                <p className="mt-1 text-sm text-slate-300">@{friend.username}</p>
                <p className="mt-1 text-sm text-slate-400">{friend.email}</p>
              </div>
            ))}

            {friends.length === 0 ? (
              <p className="text-sm text-slate-400">Your friends list is still empty.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
