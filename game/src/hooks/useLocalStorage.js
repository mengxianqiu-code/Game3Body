/**
 * localStorage 包装 hook
 * - 自动读取/写入
 * - 容错：localStorage 不可用时退化为内存状态
 */
import { useEffect, useState } from 'react';

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return typeof initial === 'function' ? initial() : initial;
      return JSON.parse(raw);
    } catch (e) {
      return typeof initial === 'function' ? initial() : initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // 忽略（隐私模式或配额满）
    }
  }, [key, value]);

  return [value, setValue];
}

export const STORAGE_KEY = 'starsea_state_v1';