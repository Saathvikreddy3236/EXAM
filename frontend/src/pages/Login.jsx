import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [form, setForm] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      await login(form);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="mx-auto w-full max-w-md animate-enter">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-sky-300/80">Welcome back</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Login to Shared Wallet</h1>
          <p className="mt-3 text-sm text-slate-300">Review balances, settle shared bills, and keep your budget in sync.</p>
        </div>

        <div className="glass-panel rounded-[32px] p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Username or Email</span>
              <div className="input-shell">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={form.usernameOrEmail}
                  onChange={(event) => setForm((current) => ({ ...current, usernameOrEmail: event.target.value }))}
                  placeholder="Enter username or email"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Password</span>
              <div className="input-shell">
                <Lock className="h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </label>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button type="submit" disabled={submitting} className="primary-button w-full justify-center disabled:opacity-70">
              {submitting ? 'Logging in...' : 'Login'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-300">
            Need an account?{' '}
            <Link to="/register" className="font-medium text-amber-200 transition hover:text-amber-100">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
