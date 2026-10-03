import { useEffect, useState } from 'react';

// Безопасное хранилище: не падает при битом JSON, переполнении квоты или запрете localStorage (бывает на iOS).
export function useStoredState<T>(key: string, initial: T, sanitize?: (v: unknown) => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed: unknown = JSON.parse(raw);
      return sanitize ? sanitize(parsed) : (parsed as T);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* квота или приватный режим */ }
  }, [key, value]);
  return [value, setValue] as const;
}
