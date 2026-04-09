import { ArrowRight, Lock, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function Register() {
  const currencyOptions = ['INR', 'USD', 'EUR', 'GBP'];
  const navigate = useNavigate();
  const { register } = useApp();
  const [form, setForm] = useState({
    username: '',
    fullname: '',
    email: '',
    currencyPreferred: 'INR',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await register({
        username: form.username,
        fullname: form.fullname,
        email: form.email,
        currencyPreferred: form.currencyPreferred,
        password: form.password,
      });
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="mx-auto w-full max-w-lg animate-enter">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-amber-200/90">Create account</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Start tracking in minutes</h1>
          <p className="mt-3 text-sm text-slate-300">Set up your personal expense tracker and manage shared requests with a polished dashboard.</p>
        </div>

        <div className="glass-panel rounded-[32px] p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Username</span>
              <div className="input-shell">
                <UserRound className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="Choose a username"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Full Name</span>
              <div className="input-shell">
                <UserRound className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={form.fullname}
                  onChange={(event) => setForm((current) => ({ ...current, fullname: event.target.value }))}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Email</span>
              <div className="input-shell">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Preferred Currency</span>
              <div className="input-shell">
                <select
                  value={form.currencyPreferred}
                  onChange={(event) => setForm((current) => ({ ...current, currencyPreferred: event.target.value }))}
                  className="w-full bg-transparent py-4 text-white outline-none"
                  required
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency} className="bg-slate-900">
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-200">Password</span>
                <div className="input-shell">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Create password"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-200">Confirm Password</span>
                <div className="input-shell">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </label>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button type="submit" disabled={submitting} className="primary-button w-full justify-center disabled:opacity-70">
              {submitting ? 'Creating account...' : 'Register'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-300">
            Already registered?{' '}
            <Link to="/login" className="font-medium text-sky-200 transition hover:text-sky-100">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
