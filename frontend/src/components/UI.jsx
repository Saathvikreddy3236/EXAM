import { AlertCircle, CheckCircle2, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
  return <div className={`glass-panel min-w-0 overflow-hidden rounded-[28px] p-5 sm:p-6 ${className}`}>{children}</div>;
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

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

export function MultiSelectDropdown({ label, options, selectedValues, onChange }) {
  const [open, setOpen] = useState(false);
  const selectedLabels = useMemo(
    () => options.filter((option) => selectedValues.includes(String(option.value))).map((option) => option.label),
    [options, selectedValues]
  );

  const toggleValue = (value) => {
    const stringValue = String(value);
    onChange(
      selectedValues.includes(stringValue)
        ? selectedValues.filter((item) => item !== stringValue)
        : [...selectedValues, stringValue]
    );
  };

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:bg-white/10"
      >
        <span className="truncate">{selectedLabels.length ? selectedLabels.join(', ') : label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur">
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {options.map((option) => {
              const checked = selectedValues.includes(String(option.value));
              return (
                <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-white transition hover:bg-white/10">
                  <input type="checkbox" checked={checked} onChange={() => toggleValue(option.value)} />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ExpenseFiltersBar({
  filters,
  onChange,
  onReset,
  categories,
  paymentModes,
  maxDate,
  sort,
  onSortChange,
  extraAction,
}) {
  const categoryOptions = categories.map((item) => ({ value: item.cat_id, label: item.cat_name }));
  const paymentModeOptions = paymentModes.map((item) => ({ value: item.mode_id, label: item.mode_name }));

  return (
    <Panel>
      <div className="grid gap-4 xl:grid-cols-6">
        <div className="min-w-0 xl:col-span-2">
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">Search</label>
          <div className="input-shell">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={filters.search}
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
              placeholder="Title or notes"
            />
          </div>
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">Categories</label>
          <MultiSelectDropdown
            label="Select categories"
            options={categoryOptions}
            selectedValues={filters.categoryIds}
            onChange={(value) => onChange({ ...filters, categoryIds: value })}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">Payment Modes</label>
          <MultiSelectDropdown
            label="Select payment modes"
            options={paymentModeOptions}
            selectedValues={filters.modeIds}
            onChange={(value) => onChange({ ...filters, modeIds: value })}
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">Start Date</label>
          <input
            type="date"
            max={maxDate}
            value={filters.startDate}
            onChange={(event) => onChange({ ...filters, startDate: event.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">End Date</label>
          <input
            type="date"
            max={maxDate}
            value={filters.endDate}
            onChange={(event) => onChange({ ...filters, endDate: event.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-6">
        <div className="min-w-0">
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">Min Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={filters.minAmount}
            onChange={(event) => onChange({ ...filters, minAmount: event.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            placeholder="0.00"
          />
        </div>

        <div className="min-w-0">
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">Max Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={filters.maxAmount}
            onChange={(event) => onChange({ ...filters, maxAmount: event.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            placeholder="0.00"
          />
        </div>

        {sort && onSortChange ? (
          <div className="min-w-0">
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">Sort By</label>
            <select
              value={sort.sortBy}
              onChange={(event) => onSortChange({ ...sort, sortBy: event.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
          </div>
        ) : null}

        {sort && onSortChange ? (
          <div className="min-w-0">
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">Order</label>
            <select
              value={sort.sortOrder}
              onChange={(event) => onSortChange({ ...sort, sortOrder: event.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="desc">{sort.sortBy === 'amount' ? 'High to Low' : 'Newest to Oldest'}</option>
              <option value="asc">{sort.sortBy === 'amount' ? 'Low to High' : 'Oldest to Newest'}</option>
            </select>
          </div>
        ) : null}

        <div className="flex flex-wrap items-end gap-3 xl:col-span-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Reset Filters
          </button>
          {extraAction}
        </div>
      </div>
    </Panel>
  );
}
