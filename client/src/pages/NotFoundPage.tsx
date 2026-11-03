import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-gold-500">404</p>
      <h1 className="mt-2 text-xl font-bold text-navy-900">ไม่พบหน้าที่ต้องการ</h1>
      <p className="mt-1 text-sm text-slate-500">หน้านี้อาจถูกย้ายหรือยังไม่เปิดใช้งาน</p>
      <Link to="/" className="btn btn-primary mt-6">
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
