# SMK Smart Exam

**ระบบจำลองการสอบ O-NET ระดับชั้น ม.3 และ ม.6**
โรงเรียนวัดศิริมงคล ตำบลหนองเม็ก อำเภอหนองหาน จังหวัดอุดรธานี
สังกัดสำนักเขตการศึกษาพระปริยัติธรรม แผนกสามัญ เขต 8

---

## ขอบเขตระบบ

- รองรับ O-NET ระดับชั้น **ม.3 และ ม.6 เท่านั้น** (ไม่รองรับ V-NET)
- คลังข้อสอบจริงย้อนหลังสูงสุด **20 ปีการศึกษา** เฉพาะที่มีเอกสารต้นฉบับตรวจสอบได้
- **ห้าม AI สร้างข้อสอบหรือเฉลยขึ้นเอง** — ทุกข้อต้องอ้างอิงเอกสารต้นฉบับและผ่านการตรวจสอบโดยบุคคล
- ผู้ใช้งาน 3 บทบาท: ผู้ดูแลระบบ (ADMIN), ครู (TEACHER), นักเรียน (STUDENT)
- โหมดฝึกสอบ และโหมดจำลองสนามสอบจริง (หน้าจอตามแนวทางระบบสอบดิจิทัลของ สทศ.)
- ตรวจคะแนน วิเคราะห์ผล และรายงาน PDF / Excel

## สถานะการพัฒนา

| Phase | ขอบเขต | สถานะ |
| --- | --- | --- |
| **Phase 1** | โครงสร้างระบบ, ฐานข้อมูล, ผู้ใช้งาน 3 บทบาท, Dashboard ภาษาไทย, โครงสร้างคลังข้อสอบ, Deploy บน Render | ✅ เสร็จ |
| Phase 2+ | เครื่องมือนำเข้าข้อสอบ, หน้าจอสอบ, ตรวจคะแนน, วิเคราะห์ผล, รายงาน PDF/Excel | รอคำสั่ง |

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + React Router 7 |
| Backend | Node.js 22 + Express 5 + TypeScript |
| Database | PostgreSQL + Prisma ORM 6 |
| Auth | JWT (Bearer) + bcrypt, จำกัดสิทธิ์ตามบทบาท, Rate limit การเข้าสู่ระบบ |
| Test | Vitest + Supertest |
| Deploy | Render.com (Blueprint `render.yaml`) |

ธีมสี: **น้ำเงินเข้ม** (`navy-900 #0b1f4d`) • **ขาว** • **ทอง** (`gold-500 #d4a72c`) ฟอนต์ Sarabun (ฝังในระบบ ไม่ต้องโหลดจากภายนอก)

## โครงสร้างโปรเจกต์

```
smk-smart-exam/
├── client/                    # Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── api/               # fetch wrapper + จัดการ token
│   │   ├── components/        # UI ส่วนกลาง (StatCard, Alert, ProtectedRoute, Logo)
│   │   ├── context/           # AuthContext
│   │   ├── layouts/           # AppLayout (Sidebar + Header)
│   │   ├── lib/               # labels ภาษาไทย, useApi hook
│   │   ├── pages/             # Login, Dashboard (Admin/Teacher/Student), Users, ExamBank, Profile
│   │   └── types/
│   └── vite.config.ts
├── server/                    # Backend (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma      # โครงสร้างฐานข้อมูลทั้งหมด
│   │   ├── migrations/        # Migration SQL
│   │   └── seed.ts            # seed วิชา O-NET + ผู้ดูแลระบบคนแรก
│   ├── src/
│   │   ├── config/env.ts      # ตรวจสอบ Environment ด้วย zod
│   │   ├── middleware/        # authenticate, requireRole, errorHandler
│   │   ├── routes/            # auth, users, dashboard, exam-bank, health
│   │   ├── app.ts             # Express app (ให้บริการ React build ใน production)
│   │   └── index.ts
│   └── tests/                 # Vitest + Supertest
├── docs/exam-bank-structure.md
├── .env.example
├── render.yaml
└── package.json               # npm workspaces
```

## เริ่มต้นพัฒนาในเครื่อง

ต้องมี **Node.js 20.19+ (แนะนำ 22)** และ **PostgreSQL 14+**

### 1. ติดตั้ง

```bash
npm install
```

### 2. สร้างฐานข้อมูล PostgreSQL

```bash
psql -U postgres -c "CREATE USER smk WITH PASSWORD 'smk_dev_pw' CREATEDB;" -c "CREATE DATABASE smk_smart_exam OWNER smk;"
```

### 3. ตั้งค่า Environment

```bash
cp .env.example server/.env
```

แก้ไข `server/.env` อย่างน้อย `DATABASE_URL`, `JWT_SECRET` (≥ 32 ตัวอักษร) และ `SEED_ADMIN_PASSWORD`
ถ้าต้องการบัญชีทดสอบ ตั้ง `SEED_DEMO_USERS=true`

### 4. สร้างตารางและข้อมูลพื้นฐาน

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

### 5. รันระบบ

```bash
npm run dev
```

- Frontend: http://localhost:5173 (proxy `/api` ไปที่ Backend)
- Backend API: http://localhost:4000/api/health

บัญชีทดสอบ (เมื่อ `SEED_DEMO_USERS=true`): `teacher.demo`, `student.m3`, `student.m6` รหัสผ่าน `demo12345`

## คำสั่งที่ใช้บ่อย

| คำสั่ง | คำอธิบาย |
| --- | --- |
| `npm run dev` | รัน Backend + Frontend พร้อมกัน |
| `npm run build` | Build Backend (prisma generate + tsc) และ Frontend (vite) |
| `npm start` | migrate deploy → seed → เริ่มเซิร์ฟเวอร์ production (ให้บริการ API + หน้าเว็บที่พอร์ตเดียว) |
| `npm test` | รันชุดทดสอบ Backend |
| `npm run typecheck` | ตรวจ TypeScript ทั้ง client และ server |
| `npm run db:migrate` | สร้าง/ปรับ migration ระหว่างพัฒนา |
| `npm run db:seed` | seed วิชาและผู้ดูแลระบบ (รันซ้ำได้) |

## API (Phase 1)

| Method | Path | สิทธิ์ |
| --- | --- | --- |
| GET | `/api/health`, `/api/health/db` | สาธารณะ |
| POST | `/api/auth/login` | สาธารณะ (จำกัด 20 ครั้ง/15 นาที) |
| GET | `/api/auth/me` | ผู้ใช้ที่เข้าสู่ระบบ |
| POST | `/api/auth/change-password` | ผู้ใช้ที่เข้าสู่ระบบ |
| GET | `/api/dashboard` | ทุกบทบาท (ข้อมูลต่างกันตามบทบาท) |
| GET | `/api/users` | ADMIN (ทั้งหมด), TEACHER (เฉพาะนักเรียน) |
| POST | `/api/users` | ADMIN |
| PATCH | `/api/users/:id` | ADMIN |
| POST | `/api/users/:id/reset-password` | ADMIN |
| * | `/api/exam-bank/*` | ดู [docs/exam-bank-structure.md](docs/exam-bank-structure.md) |

## Deploy บน Render.com

1. Push โค้ดขึ้น GitHub (branch `main`)
2. เข้า [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → เลือก Repository `smk-smart-exam`
3. Render อ่าน `render.yaml` และสร้าง
   - PostgreSQL `smk-smart-exam-db` (ภูมิภาค Singapore)
   - Web Service `smk-smart-exam`
4. กรอก **`SEED_ADMIN_PASSWORD`** (อย่างน้อย 8 ตัวอักษร) เมื่อ Render ถาม
5. กด **Apply** — ระบบจะ build, migrate, seed และเปิดให้บริการ
6. เข้าสู่ระบบด้วย `admin` / รหัสผ่านที่ตั้งไว้ แล้ว **เปลี่ยนรหัสผ่านทันที** ที่เมนู "ข้อมูลส่วนตัว"

> `JWT_SECRET` ถูกสร้างแบบสุ่มโดย Render อัตโนมัติ (`generateValue: true`)

### ข้อควรทราบเกี่ยวกับแพ็กเกจฟรีของ Render

- Web Service ฟรีจะ **หยุดทำงานเมื่อไม่มีการใช้งาน ~15 นาที** การเปิดครั้งแรกหลังจากนั้นใช้เวลาประมาณ 1 นาที
- PostgreSQL ฟรี **มีอายุจำกัด** (ตามนโยบายของ Render) — สำหรับใช้งานจริงในโรงเรียนควรอัปเกรดเป็นแพ็กเกจแบบชำระเงิน และเปิดการสำรองข้อมูล
- ช่วงจัดสอบจำลองพร้อมกันหลายคน ควรใช้แพ็กเกจ Starter ขึ้นไปเพื่อไม่ให้ Service หยุดระหว่างสอบ

## ความปลอดภัย

- รหัสผ่านเข้ารหัสด้วย bcrypt, ไม่ส่ง `passwordHash` ออกจาก API
- JWT หมดอายุตาม `JWT_EXPIRES_IN` และตรวจสถานะบัญชีจากฐานข้อมูลทุกคำขอ (ระงับบัญชีมีผลทันที)
- Helmet (security headers), จำกัดขนาด request body, Rate limit การเข้าสู่ระบบ
- บันทึกการใช้งาน (AuditLog) สำหรับการเข้าสู่ระบบและการแก้ไขข้อมูลสำคัญ
- ฐานข้อมูลบน Render ปิดการเข้าถึงจากภายนอก (`ipAllowList: []`)

## นโยบายเนื้อหาข้อสอบ

ระบบนี้ **ไม่มีข้อสอบหรือเฉลยติดมากับซอร์สโค้ด** และ **ไม่สร้างข้อสอบด้วย AI**
ข้อสอบทุกข้อต้องถอดความจากเอกสารต้นฉบับของ สถาบันทดสอบทางการศึกษาแห่งชาติ (สทศ.) ที่ตรวจสอบได้
พร้อมบันทึกแหล่งอ้างอิงและหน้าเอกสาร และต้องผ่านการยืนยันจากผู้ดูแลระบบก่อนเผยแพร่ให้นักเรียน
รายละเอียดเพิ่มเติม: [docs/exam-bank-structure.md](docs/exam-bank-structure.md)
