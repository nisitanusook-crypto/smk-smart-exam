import type { ReactNode } from 'react';
import { fullName } from '../../lib/labels';
import type { User } from '../../types';

function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'สวัสดีตอนเช้า';
  if (h < 17) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนเย็น';
}

export function WelcomeBanner({ user, academicYear, children }: { user: User; academicYear: number; children?: ReactNode }) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl bg-navy-900 px-6 py-7 text-white shadow-md sm:px-8">
      <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[18px] border-gold-500/20" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-gold-500 via-gold-300 to-transparent" aria-hidden />
      <p className="text-sm text-gold-300">
        {greeting()} • ปีการศึกษา {academicYear}
      </p>
      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{fullName(user)}</h1>
      {children && <div className="mt-3 text-sm text-navy-100">{children}</div>}
    </section>
  );
}
