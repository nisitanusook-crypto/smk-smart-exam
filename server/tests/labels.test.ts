import { describe, expect, it } from 'vitest';
import { currentAcademicYear, supportedAcademicYears } from '../src/utils/labels.js';

describe('ปีการศึกษา', () => {
  it('ก่อนเดือนพฤษภาคมยังเป็นปีการศึกษาก่อนหน้า', () => {
    expect(currentAcademicYear(new Date(2026, 1, 15))).toBe(2568); // ก.พ. 2569
  });

  it('ตั้งแต่เดือนพฤษภาคมเป็นปีการศึกษาใหม่', () => {
    expect(currentAcademicYear(new Date(2026, 4, 16))).toBe(2569);
  });

  it('รองรับย้อนหลัง 20 ปีการศึกษา', () => {
    const { from, to } = supportedAcademicYears(new Date(2026, 10, 3));
    expect(to).toBe(2569);
    expect(to - from + 1).toBe(20);
  });
});
