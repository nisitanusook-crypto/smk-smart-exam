/**
 * Seed ข้อมูลพื้นฐานของระบบ SMK Smart Exam
 *
 * สิ่งที่ seed:
 *   - รายวิชา O-NET ระดับ ม.3 และ ม.6 (โครงสร้างคลังข้อสอบ)
 *   - บัญชีผู้ดูแลระบบคนแรก (จาก SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD)
 *   - (ทางเลือก) บัญชีครู/นักเรียนตัวอย่าง เมื่อ SEED_DEMO_USERS=true
 *
 * สิ่งที่ "ไม่" seed:
 *   - ข้อสอบและเฉลย — ต้องนำเข้าจากเอกสารต้นฉบับของ สทศ. ที่ตรวจสอบได้เท่านั้น
 *     (ระบบนี้ห้ามสร้างข้อสอบหรือเฉลยขึ้นเอง)
 *
 * สคริปต์นี้รันซ้ำได้อย่างปลอดภัย (idempotent)
 */
import { PrismaClient, type GradeLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface SubjectSeed {
  code: string;
  nameTh: string;
  nameEn: string;
  /** วิชาที่ยังสอบในปัจจุบัน — ผู้ดูแลระบบปรับได้ภายหลังตามประกาศ สทศ. */
  isActive: boolean;
  sortOrder: number;
}

/**
 * กลุ่มสาระที่เคยปรากฏในการสอบ O-NET
 * หมายเหตุ: รายวิชาที่สอบแต่ละปีเปลี่ยนแปลงตามประกาศของ สทศ.
 * ผู้ดูแลระบบควรตรวจสอบสถานะ isActive กับประกาศล่าสุดก่อนใช้งานจริง
 */
const SUBJECTS: Record<GradeLevel, SubjectSeed[]> = {
  M3: [
    { code: 'TH', nameTh: 'ภาษาไทย', nameEn: 'Thai Language', isActive: true, sortOrder: 1 },
    { code: 'MA', nameTh: 'คณิตศาสตร์', nameEn: 'Mathematics', isActive: true, sortOrder: 2 },
    { code: 'SC', nameTh: 'วิทยาศาสตร์', nameEn: 'Science', isActive: true, sortOrder: 3 },
    { code: 'EN', nameTh: 'ภาษาอังกฤษ', nameEn: 'English', isActive: true, sortOrder: 4 },
    { code: 'SO', nameTh: 'สังคมศึกษา ศาสนา และวัฒนธรรม', nameEn: 'Social Studies, Religion and Culture', isActive: false, sortOrder: 5 },
    { code: 'HE', nameTh: 'สุขศึกษาและพลศึกษา', nameEn: 'Health and Physical Education', isActive: false, sortOrder: 6 },
    { code: 'AR', nameTh: 'ศิลปะ', nameEn: 'Arts', isActive: false, sortOrder: 7 },
    { code: 'CT', nameTh: 'การงานอาชีพและเทคโนโลยี', nameEn: 'Careers and Technology', isActive: false, sortOrder: 8 },
  ],
  M6: [
    { code: 'TH', nameTh: 'ภาษาไทย', nameEn: 'Thai Language', isActive: true, sortOrder: 1 },
    { code: 'SO', nameTh: 'สังคมศึกษา ศาสนา และวัฒนธรรม', nameEn: 'Social Studies, Religion and Culture', isActive: true, sortOrder: 2 },
    { code: 'EN', nameTh: 'ภาษาอังกฤษ', nameEn: 'English', isActive: true, sortOrder: 3 },
    { code: 'MA', nameTh: 'คณิตศาสตร์', nameEn: 'Mathematics', isActive: true, sortOrder: 4 },
    { code: 'SC', nameTh: 'วิทยาศาสตร์', nameEn: 'Science', isActive: true, sortOrder: 5 },
    { code: 'HE', nameTh: 'สุขศึกษาและพลศึกษา', nameEn: 'Health and Physical Education', isActive: false, sortOrder: 6 },
    { code: 'AR', nameTh: 'ศิลปะ', nameEn: 'Arts', isActive: false, sortOrder: 7 },
    { code: 'CT', nameTh: 'การงานอาชีพและเทคโนโลยี', nameEn: 'Careers and Technology', isActive: false, sortOrder: 8 },
  ],
};

const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);

async function seedSubjects() {
  let count = 0;
  for (const [gradeLevel, subjects] of Object.entries(SUBJECTS) as [GradeLevel, SubjectSeed[]][]) {
    for (const s of subjects) {
      // ไม่เขียนทับ isActive ที่ผู้ดูแลระบบปรับไว้แล้ว
      await prisma.subject.upsert({
        where: { code_gradeLevel: { code: s.code, gradeLevel } },
        update: { nameTh: s.nameTh, nameEn: s.nameEn, sortOrder: s.sortOrder },
        create: { ...s, gradeLevel },
      });
      count++;
    }
  }
  console.log(`✔ รายวิชา O-NET ม.3/ม.6: ${count} รายการ`);
}

async function seedAdmin() {
  const username = (process.env.SEED_ADMIN_USERNAME ?? 'admin').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`✔ ผู้ดูแลระบบ "${username}" มีอยู่แล้ว (ไม่เปลี่ยนรหัสผ่าน)`);
    return;
  }
  if (!password || password.length < 8) {
    console.warn('⚠ ข้ามการสร้างผู้ดูแลระบบ: ต้องกำหนด SEED_ADMIN_PASSWORD (อย่างน้อย 8 ตัวอักษร)');
    return;
  }

  await prisma.user.create({
    data: {
      username,
      passwordHash: await bcrypt.hash(password, rounds),
      role: 'ADMIN',
      firstName: 'ผู้ดูแลระบบ',
      lastName: 'SMK Smart Exam',
    },
  });
  console.log(`✔ สร้างบัญชีผู้ดูแลระบบ "${username}" แล้ว — กรุณาเปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก`);
}

/** บัญชีตัวอย่างสำหรับทดสอบในเครื่องนักพัฒนาเท่านั้น */
async function seedDemoUsers() {
  if (process.env.SEED_DEMO_USERS !== 'true') return;
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠ ไม่สร้างบัญชีตัวอย่างในโหมด production');
    return;
  }

  const passwordHash = await bcrypt.hash('demo12345', rounds);

  await prisma.user.upsert({
    where: { username: 'teacher.demo' },
    update: {},
    create: {
      username: 'teacher.demo',
      passwordHash,
      role: 'TEACHER',
      prefix: 'นาย',
      firstName: 'ครูทดสอบ',
      lastName: 'ระบบ',
      teacherProfile: { create: { department: 'คณิตศาสตร์' } },
    },
  });

  const demoStudents: { username: string; studentCode: string; gradeLevel: GradeLevel }[] = [
    { username: 'student.m3', studentCode: 'DEMO-M3-001', gradeLevel: 'M3' },
    { username: 'student.m6', studentCode: 'DEMO-M6-001', gradeLevel: 'M6' },
  ];
  for (const s of demoStudents) {
    await prisma.user.upsert({
      where: { username: s.username },
      update: {},
      create: {
        username: s.username,
        passwordHash,
        role: 'STUDENT',
        prefix: 'สามเณร',
        firstName: 'นักเรียนทดสอบ',
        lastName: s.gradeLevel === 'M3' ? 'ม.3' : 'ม.6',
        studentProfile: { create: { studentCode: s.studentCode, gradeLevel: s.gradeLevel } },
      },
    });
  }
  console.log('✔ บัญชีตัวอย่าง: teacher.demo, student.m3, student.m6 (รหัสผ่าน demo12345)');
}

async function main() {
  console.log('🌱 เริ่ม seed ข้อมูลพื้นฐาน SMK Smart Exam');
  await seedSubjects();
  await seedAdmin();
  await seedDemoUsers();
  console.log('ℹ ไม่มีการ seed ข้อสอบ/เฉลย — ต้องนำเข้าจากเอกสารต้นฉบับ สทศ. เท่านั้น');
}

main()
  .catch((err) => {
    console.error('❌ seed ล้มเหลว', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
