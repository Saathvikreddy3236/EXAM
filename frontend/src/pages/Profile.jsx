import { LogOut, Mail, MapPin, PencilLine, Save, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Panel, Pill, SectionHeader } from '../components/UI';

export default function Profile() {
  const currencyOptions = ['INR', 'USD', 'EUR', 'GBP'];
  const navigate = useNavigate();
  const { user, avatar, logout, updateProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fullname: user?.fullname || '',
    email: user?.email || '',
    currencyPreferred: user?.currency_preferred || 'USD',
  });

  const handleSave = async () => {
    await updateProfile({
      email: form.email,
      fullname: form.fullname,
      currencyPreferred: form.currencyPreferred,
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Profile"
        title="Personal details and account controls in one place."
        description="Review your account information, make a quick profile update, or sign out when you are done."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-amber-300/15 text-2xl font-semibold text-amber-100">
              {avatar}
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white">{user?.fullname}</h3>
              <p className="mt-1 text-slate-300">@{user?.username}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="blue">{user?.currency_preferred}</Pill>
                <Pill tone="default">JWT secured</Pill>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-white/5 p-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Mail className="h-4 w-4 text-sky-200" />
                {user?.email}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </Panel>

        <Panel>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Edit profile</h3>
              <p className="mt-1 text-sm text-slate-300">Local UI only, saved in dummy app state.</p>
            </div>
            <Pill tone={isEditing ? 'yellow' : 'green'}>{isEditing ? 'Editing' : 'Saved'}</Pill>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Full name</span>
              <div className="input-shell">
                <UserRound className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={form.fullname}
                  onChange={(event) => setForm((current) => ({ ...current, fullname: event.target.value }))}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Email</span>
              <div className="input-shell">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  disabled={!isEditing}
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Username</span>
              <div className="input-shell">
                <PencilLine className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={user?.username || ''}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Preferred Currency</span>
              <div className="input-shell">
                <MapPin className="h-5 w-5 text-slate-400" />
                <select
                  disabled={!isEditing}
                  value={form.currencyPreferred}
                  onChange={(event) => setForm((current) => ({ ...current, currencyPreferred: event.target.value }))}
                  className="w-full bg-transparent py-4 text-white outline-none disabled:cursor-not-allowed"
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency} className="bg-slate-900">
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {isEditing ? (
              <button type="button" onClick={handleSave} className="primary-button">
                <Save className="h-4 w-4" />
                Save Profile
              </button>
            ) : (
              <button type="button" onClick={() => setIsEditing(true)} className="primary-button">
                <PencilLine className="h-4 w-4" />
                Edit Profile
              </button>
            )}

            {isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setForm({
                    fullname: user?.fullname || '',
                    email: user?.email || '',
                    currencyPreferred: user?.currency_preferred || 'USD',
                  });
                  setIsEditing(false);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
