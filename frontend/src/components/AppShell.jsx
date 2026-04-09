import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BadgePlus,
  BriefcaseBusiness,
  CircleDollarSign,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  ReceiptText,
  UserRound,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/add-expense', label: 'Add Expense', icon: BadgePlus },
  { to: '/dashboard/budget', label: 'Budget', icon: PiggyBank },
  { to: '/dashboard/pay', label: 'Amount to Pay', icon: WalletCards },
  { to: '/dashboard/receive', label: 'Amount to Receive', icon: HandCoins },
  { to: '/dashboard/friends', label: 'Friends', icon: Users },
  { to: '/dashboard/personal-expenses', label: 'Personal', icon: ReceiptText },
  { to: '/dashboard/shared-expenses', label: 'Shared', icon: BriefcaseBusiness },
  { to: '/dashboard/profile', label: 'Profile', icon: UserRound },
];

function SidebarContent({ onNavigate }) {
  const navigate = useNavigate();
  const { dashboard, friends, logout, user, avatar, owed, receivable } = useApp();

  const quickStats = useMemo(
    () => [
      { label: 'Total Expenses', value: `$${Number(dashboard?.total_expenses || 0).toFixed(2)}` },
      { label: 'Amount to Pay', value: `$${Number(dashboard?.you_owe || 0).toFixed(2)}` },
      { label: 'Amount to Receive', value: `$${Number(dashboard?.you_are_owed || 0).toFixed(2)}` },
      { label: 'Friends', value: `${friends.length}` },
    ],
    [dashboard?.total_expenses, dashboard?.you_are_owed, dashboard?.you_owe, friends.length]
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/20 text-amber-200">
            <CircleDollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Expense Flow</p>
            <h1 className="text-lg font-semibold text-white">Shared Wallet</h1>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="glass-panel rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/20 font-semibold text-emerald-100">
              {avatar}
            </div>
            <div>
              <p className="font-medium text-white">{user?.fullname || user?.username}</p>
              <p className="text-sm text-slate-300">{user?.currency_preferred || 'USD'} account</p>
            </div>
          </div>
        </div>

        <nav className="mt-5">
          <div className="space-y-2">
            {navItems.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                end={exact}
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition duration-300',
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg shadow-slate-900/10'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-white">
              <BriefcaseBusiness className="h-4 w-4 text-amber-200" />
              Monthly snapshot
            </div>
            <div className="space-y-3">
              {quickStats.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-sm text-white">Settlements</div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Open payables</span>
                <span className="font-medium text-white">{owed.filter((item) => item.status === 'pending').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Open receivables</span>
                <span className="font-medium text-white">{receivable.filter((item) => item.status === 'pending').length}</span>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <div className="shrink-0 border-t border-white/10 px-4 py-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const { user, avatar, isLoading } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_28%),radial-gradient(circle_at_85%_15%,_rgba(56,189,248,0.15),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]" />

      <div className="relative flex min-h-screen">
        <aside className="hidden h-screen w-80 overflow-hidden border-r border-white/10 bg-slate-950/80 backdrop-blur xl:block">
          <SidebarContent />
        </aside>

        {open ? <div className="fixed inset-0 z-40 bg-slate-950/70 xl:hidden" onClick={() => setOpen(false)} /> : null}

        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 h-screen w-80 overflow-hidden border-r border-white/10 bg-slate-950/95 backdrop-blur transition-transform duration-300 xl:hidden',
            open ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <div className="flex items-center justify-end px-4 pt-4">
            <button
              type="button"
              className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </aside>

        <div className="relative flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 xl:hidden"
                  onClick={() => setOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Shared expense tracker</p>
                  <h2 className="text-lg font-semibold text-white">Welcome back, {(user?.fullname || user?.username || 'there').split(' ')[0]}</h2>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs text-slate-400">{isLoading ? 'Syncing' : 'Preferred currency'}</p>
                  <p className="text-sm font-medium text-white">{user?.currency_preferred || 'USD'}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 font-semibold text-white">
                  {avatar}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
