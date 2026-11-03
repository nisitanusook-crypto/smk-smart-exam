import { useAuth } from '../context/AuthContext';
import { useApi } from '../lib/useApi';
import { Alert, Spinner } from '../components/ui';
import type { DashboardData } from '../types';
import { AdminDashboard } from './dashboard/AdminDashboard';
import { TeacherDashboard } from './dashboard/TeacherDashboard';
import { StudentDashboard } from './dashboard/StudentDashboard';

export function DashboardPage() {
  const { user } = useAuth();
  const { data, error, loading } = useApi<DashboardData>('/dashboard');

  if (loading) return <Spinner />;
  if (error || !data || !user) return <Alert tone="error">{error ?? 'ไม่สามารถโหลดข้อมูลได้'}</Alert>;

  switch (data.role) {
    case 'ADMIN':
      return <AdminDashboard data={data} user={user} />;
    case 'TEACHER':
      return <TeacherDashboard data={data} user={user} />;
    case 'STUDENT':
      return <StudentDashboard data={data} user={user} />;
  }
}
