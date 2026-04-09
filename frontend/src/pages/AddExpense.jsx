import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { Panel, Pill, SectionHeader } from '../components/UI';

const requiredCategories = ['Food & Dining', 'Transport', 'Shopping', 'Entertainment', 'Health & Medical', 'Education', 'Utilities', 'Other'];
const requiredPaymentModes = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking'];

export default function AddExpense() {
  const { categories, paymentModes, friends, addExpense, getLocalDateString } = useApp();
  const today = getLocalDateString();
  const [form, setForm] = useState({
    title: '',
    amount: '',
    catId: '',
    date: today,
    modeId: '',
    note: '',
    isShared: false,
    splitType: 'equal',
    selectedFriends: [],
    customAmounts: {},
  });
  const [message, setMessage] = useState('');

  const selectedFriendObjects = useMemo(
    () => friends.filter((friend) => form.selectedFriends.includes(friend.username)),
    [friends, form.selectedFriends]
  );
  const categoryOptions = useMemo(
    () => requiredCategories.map((name) => categories.find((category) => category.cat_name === name)).filter(Boolean),
    [categories]
  );
  const paymentModeOptions = useMemo(
    () => requiredPaymentModes.map((name) => paymentModes.find((mode) => mode.mode_name === name)).filter(Boolean),
    [paymentModes]
  );

  const toggleFriend = (username) => {
    setForm((current) => ({
      ...current,
      selectedFriends: current.selectedFriends.includes(username)
        ? current.selectedFriends.filter((item) => item !== username)
        : [...current.selectedFriends, username],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.title.trim().length > 80) {
      setMessage('Title cannot exceed 80 characters.');
      return;
    }

    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setMessage('Amount must be greater than 0.');
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(form.amount)) {
      setMessage('Amount can have up to 2 decimal places only.');
      return;
    }

    if (form.date > today) {
      setMessage('Date cannot be in the future.');
      return;
    }

    const participants = form.selectedFriends.map((username) => ({
      username,
      amount: form.splitType === 'custom' ? Number(form.customAmounts[username] || 0) : undefined,
    }));

    try {
      await addExpense({
        title: form.title,
        amount: Number(form.amount),
        catId: Number(form.catId),
        date: form.date,
        modeId: Number(form.modeId),
        note: form.note.trim(),
        isShared: form.isShared,
        splitType: form.splitType,
        participants,
      });

      setMessage('Expense created successfully.');
      setForm({
        title: '',
        amount: '',
        catId: '',
        date: getLocalDateString(),
        modeId: '',
        note: '',
        isShared: false,
        splitType: 'equal',
        selectedFriends: [],
        customAmounts: {},
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not add expense.');
    }
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Add Expense"
        title="Create a personal or shared expense entry."
        description="Store payment details, choose a category and payment mode, then optionally split the amount equally or with custom participant amounts."
      />

      <Panel className="max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Expense title"
              maxLength={80}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              required
            />
            <input
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              required
            />
            <select
              value={form.catId}
              onChange={(event) => setForm((current) => ({ ...current, catId: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              required
            >
              <option value="">Category</option>
              {categoryOptions.map((category) => (
                <option key={category.cat_id} value={category.cat_id}>
                  {category.cat_name}
                </option>
              ))}
            </select>
            <select
              value={form.modeId}
              onChange={(event) => setForm((current) => ({ ...current, modeId: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              required
            >
              <option value="">Payment mode</option>
              {paymentModeOptions.map((mode) => (
                <option key={mode.mode_id} value={mode.mode_id}>
                  {mode.mode_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <input
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              type="date"
              max={today}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
              required
            />
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
              <input
                checked={form.isShared}
                onChange={(event) => setForm((current) => ({ ...current, isShared: event.target.checked }))}
                type="checkbox"
              />
              Split with others
            </label>
          </div>

          <div className="space-y-2">
            <textarea
              value={form.note}
              onChange={(event) => {
                const nextValue = event.target.value.slice(0, 200);
                setForm((current) => ({ ...current, note: nextValue }));
              }}
              placeholder="Add an optional note"
              rows="4"
              maxLength={200}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            />
            <div className="text-right text-xs text-slate-400">{form.note.length}/200</div>
          </div>

          {form.isShared ? (
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-300">Split type</span>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, splitType: 'equal' }))}
                  className={`rounded-full px-4 py-2 text-sm ${form.splitType === 'equal' ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-white'}`}
                >
                  Equal
                </button>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, splitType: 'custom' }))}
                  className={`rounded-full px-4 py-2 text-sm ${form.splitType === 'custom' ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-white'}`}
                >
                  Custom
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {friends.map((friend) => (
                  <label key={friend.username} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{friend.fullname}</p>
                        <p className="text-sm text-slate-400">@{friend.username}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.selectedFriends.includes(friend.username)}
                        onChange={() => toggleFriend(friend.username)}
                      />
                    </div>

                    {form.splitType === 'custom' && form.selectedFriends.includes(friend.username) ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount owed"
                        value={form.customAmounts[friend.username] || ''}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            customAmounts: {
                              ...current.customAmounts,
                              [friend.username]: event.target.value,
                            },
                          }))
                        }
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    ) : null}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {selectedFriendObjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedFriendObjects.map((friend) => (
                <Pill key={friend.username} tone="blue">
                  {friend.fullname}
                </Pill>
              ))}
            </div>
          ) : null}

          {message ? <p className="text-sm text-slate-300">{message}</p> : null}

          <button type="submit" className="primary-button">
            Save Expense
          </button>
        </form>
      </Panel>
    </div>
  );
}
