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
