import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

export function Spinner({ label = 'กำลังโหลด...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-navy-700" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950">
      <div className="flex items-center gap-3 text-white">
        <Loader2 className="h-6 w-6 animate-spin text-gold-400" aria-hidden />
        <span>กำลังเตรียมระบบ...</span>
      </div>
    </div>
  );
}

type AlertTone = 'error' | 'success' | 'info';
const alertStyles: Record<AlertTone, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-navy-200 bg-navy-50 text-navy-900',
};
const alertIcons = { error: AlertCircle, success: CheckCircle2, info: Info };

export function Alert({ tone = 'info', children }: { tone?: AlertTone; children: ReactNode }) {
  const Icon = alertIcons[tone];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${alertStyles[tone]}`} role="alert">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 sm:text-[1.7rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = 'navy',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: 'navy' | 'gold';
}) {
  return (
    <div className="card relative overflow-hidden p-4 sm:p-5">
      <div
        className={`absolute inset-x-0 top-0 h-1 ${accent === 'gold' ? 'bg-gold-500' : 'bg-navy-800'}`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-navy-900 sm:text-3xl">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {icon && (
          <div
            className={`hidden rounded-xl p-2.5 sm:block ${
              accent === 'gold' ? 'bg-gold-100 text-gold-700' : 'bg-navy-100 text-navy-800'
            }`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = 'navy',
}: {
  children: ReactNode;
  tone?: 'navy' | 'gold' | 'green' | 'gray' | 'red';
}) {
  const tones = {
    navy: 'bg-navy-100 text-navy-800',
    gold: 'bg-gold-100 text-gold-800',
    green: 'bg-emerald-100 text-emerald-800',
    gray: 'bg-slate-100 text-slate-600',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-white px-6 py-10 text-center">
      {icon && <div className="mb-3 text-navy-300">{icon}</div>}
      <p className="font-semibold text-navy-900">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-slate-500">{children}</div>}
    </div>
  );
}
