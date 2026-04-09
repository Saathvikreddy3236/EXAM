import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useEffect } from 'react';

export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs uppercase tracking-[0.32em] text-sky-300/80">{eyebrow}</p>
        ) : null}
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function Panel({ className = '', children }) {
  return <div className={`glass-panel rounded-[28px] p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function Pill({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-white/10 text-slate-200',
    green: 'bg-emerald-400/15 text-emerald-200',
    yellow: 'bg-amber-300/15 text-amber-100',
    red: 'bg-rose-400/15 text-rose-200',
    blue: 'bg-sky-400/15 text-sky-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={[
        'pointer-events-auto flex w-full items-start gap-3 rounded-3xl border px-4 py-4 shadow-2xl backdrop-blur',
        toast.type === 'error'
          ? 'border-rose-400/20 bg-rose-950/80 text-rose-50'
          : 'border-emerald-400/20 bg-emerald-950/80 text-emerald-50',
      ].join(' ')}
    >
      <div className="mt-0.5">
        {toast.type === 'error' ? <AlertCircle className="h-5 w-5 text-rose-200" /> : <CheckCircle2 className="h-5 w-5 text-emerald-200" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{toast.title}</p>
        {toast.message ? <p className="mt-1 text-sm opacity-90">{toast.message}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-full p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastViewport({ toasts, onDismiss }) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
