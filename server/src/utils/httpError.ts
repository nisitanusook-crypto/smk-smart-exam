export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message = 'คำขอไม่ถูกต้อง', details?: unknown) =>
  new HttpError(400, message, details);
export const unauthorized = (message = 'กรุณาเข้าสู่ระบบ') => new HttpError(401, message);
export const forbidden = (message = 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้') => new HttpError(403, message);
export const notFound = (message = 'ไม่พบข้อมูล') => new HttpError(404, message);
export const conflict = (message = 'ข้อมูลซ้ำกับที่มีอยู่แล้ว') => new HttpError(409, message);
