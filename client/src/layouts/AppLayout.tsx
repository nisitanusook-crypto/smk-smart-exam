import { useEffect, useState, type ComponentType } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Timer,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { fullName, ROLE_LABELS } from '../lib/labels';
import type { Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles: Role[];
  /** เมนูที่จะเปิดใช้งานใน Phase ถัดไป */
  upcoming?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'หน้าหลัก', icon: LayoutDashboard, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { to: '/exam-bank', label: 'คลังข้อสอบ O-NET', icon: Library, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { to: '/users', label: 'จัดการผู้ใช้งาน', icon: Users, roles: ['ADMIN'] },
  { to: '/users', label: 'รายชื่อนักเรียน', icon: Users, roles: ['TEACHER'] },
  { to: '/practice', label: 'โหมดฝึกสอบ', icon: BookOpenCheck, roles: ['STUDENT'], upcoming: true },
  { to: '/simulation', label: 'จำลองสนามสอบจริง', icon: Timer, roles: ['STUDENT'], upcoming: true },
  { to: '/results', label: 'ผลการสอบของฉัน', icon: ClipboardList, roles: ['STUDENT'], upcoming: true },
  { to: '/reports', label: 'วิเคราะห์ผล & รายงาน', icon: BarChart3, roles: ['ADMIN', 'TEACHER'], upcoming: true },
  { to: '/profile', label: 'ข้อมูลส่วนตัว', icon: UserCircle, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  if (!user) return null;
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role));

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-950 text-navy-100">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <Logo size={42} />
        <div className="leading-tight">
          <p className="text-lg font-bold text-white">
            SMK <span className="text-gold-400">Smart Exam</span>
          </p>
          <p className="text-xs text-navy-300">ระบบจำลองการสอบ O-NET</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="เมนูหลัก">
        {items.map((item) =>
          item.upcoming ? (
            <div
              key={item.to + item.label}
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-navy-400"
              title="จะเปิดใช้งานในระยะถัดไป"
              aria-disabled
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              <span className="rounded-full border border-gold-700/60 px-2 py-0.5 text-[10px] text-gold-400">
                เร็ว ๆ นี้
              </span>
            </div>
          ) : (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gold-500 text-navy-950 shadow'
                    : 'text-navy-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ),
        )}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-xs leading-relaxed text-navy-300">
        <p className="font-semibold text-gold-400">โรงเรียนวัดศิริมงคล</p>
        <p>ต.หนองเม็ก อ.หนองหาน จ.อุดรธานี</p>
        <p>สำนักเขตการศึกษาพระปริยัติธรรม แผนกสามัญ เขต 8</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-72">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">{sidebar}</aside>

      {/* Sidebar — mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy-950/60"
            aria-label="ปิดเมนู"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85vw] shadow-xl">{sidebar}</aside>
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-navy-100 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-navy-900 hover:bg-navy-50 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="เปิด/ปิดเมนู"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="hidden text-sm text-slate-500 sm:block">
            O-NET <span className="font-semibold text-navy-900">ม.3</span> และ{' '}
            <span className="font-semibold text-navy-900">ม.6</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-navy-900">{fullName(user)}</p>
              <p className="text-xs text-gold-700">{ROLE_LABELS[user.role]}</p>
            </div>
            <button type="button" onClick={logout} className="btn btn-outline px-3" title="ออกจากระบบ">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-navy-900 via-gold-500 to-navy-900" aria-hidden />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
