import { ArrowRight, CheckCircle2, PiggyBank, ReceiptIndianRupee, Users2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const highlights = [
  { label: 'Track every spend', icon: ReceiptIndianRupee },
  { label: 'Split bills instantly', icon: Users2 },
  { label: 'Stay within budget', icon: PiggyBank },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_28%),radial-gradient(circle_at_75%_20%,_rgba(251,191,36,0.18),_transparent_24%),linear-gradient(160deg,_#020617_0%,_#0f172a_48%,_#111827_100%)]" />
      <div className="absolute -left-12 top-20 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="absolute bottom-8 right-8 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="animate-enter flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-amber-200 shadow-lg shadow-sky-900/20">
              <ReceiptIndianRupee className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Expense Tracker</p>
              <h1 className="text-lg font-semibold">Shared Wallet</h1>
            </div>
          </div>

          <Link
            to="/login"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Login
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-14 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <section className="animate-enter space-y-8 [animation-delay:120ms]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Shared expenses without the spreadsheet chaos
            </div>

            <div className="max-w-3xl space-y-5">
              <h2 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Keep personal spending clear, shared bills fair, and cash flow calm.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Shared Wallet helps you log expenses, track who owes what, and stay on top of your monthly budget with a clean, modern dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-200"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Login
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map(({ label, icon: Icon }, index) => (
                <div
                  key={label}
                  className="animate-enter glass-panel rounded-3xl p-4 text-sm text-slate-200"
                  style={{ animationDelay: `${240 + index * 120}ms` }}
                >
                  <Icon className="mb-3 h-5 w-5 text-sky-300" />
                  <p>{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-amber-300/20 bg-amber-300/10 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-100/80">Demo Access</p>
              <p className="mt-3 text-sm text-slate-100">Email: <span className="font-semibold">demo@testing.com</span></p>
              <p className="mt-1 text-sm text-slate-100">Password: <span className="font-semibold">Demo@123</span></p>
              <p className="mt-3 text-sm text-slate-300">This demo account is seeded automatically by the backend during startup.</p>
            </div>
          </section>

          <section className="animate-enter [animation-delay:220ms]">
            <div className="glass-panel mx-auto max-w-xl rounded-[32px] p-5 shadow-2xl shadow-slate-950/40 sm:p-6">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5">
                <div className="mb-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Designed for clarity</p>
                  <p className="mt-2 text-3xl font-semibold text-white">A clean workflow for personal and shared expenses.</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="text-sm font-medium text-white">Log personal payments</p>
                    <p className="mt-2 text-sm text-slate-300">Capture title, amount, category, payment mode, and date in one place.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-sm font-medium text-white">Split shared bills</p>
                      <p className="mt-2 text-sm text-slate-300">Track who paid, who owes, and what has already been repaid.</p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-sm font-medium text-white">Monitor category budgets</p>
                      <p className="mt-2 text-sm text-slate-300">See quick warning colors as spending approaches or crosses your limits.</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-sky-400/10 to-emerald-300/10 p-4">
                    <p className="text-sm font-medium text-white">Stay organized without backend confusion on the first screen.</p>
                    <p className="mt-2 text-sm text-slate-300">Sign in to manage friends, add expenses, track settlements, and review your dashboard.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
