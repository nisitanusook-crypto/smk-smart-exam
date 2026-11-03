import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';

/** ดึงข้อมูลจาก API พร้อมสถานะ loading / error */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api<T>(path, { signal: controller.signal })
      .then(setData)
      .catch((err: unknown) => {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, loading, reload };
}
