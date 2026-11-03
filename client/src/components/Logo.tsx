interface LogoProps {
  size?: number;
  className?: string;
}

/** ตราสัญลักษณ์ระบบ SMK Smart Exam (โล่ทอง + เครื่องหมายถูก) */
export function Logo({ size = 40, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="ตราสัญลักษณ์ SMK Smart Exam"
    >
      <rect width="64" height="64" rx="14" fill="#0b1f4d" />
      <path
        d="M32 10l18 8v12c0 11-7.6 20.6-18 24-10.4-3.4-18-13-18-24V18z"
        fill="none"
        stroke="#d4a72c"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M24 32l6 6 11-12"
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
