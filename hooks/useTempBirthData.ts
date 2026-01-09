/**
 * useTempBirthData - 临时生日数据存储 hook
 *
 * 用于访客体验星盘功能，数据存储在 localStorage
 * 登录后可将临时数据迁移到用户账户
 */

import { useState, useCallback } from "react";
import type { UserBirthData, UserLocation } from "../context/UserContext";

const STORAGE_KEY = "silksparks_temp_birth_data";

export interface TempBirthData {
  date: Date | null;
  time: string;
  location: UserLocation | null;
}

interface StoredData {
  date: string | null;
  time: string;
  location: UserLocation | null;
}

function loadFromStorage(): TempBirthData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed: StoredData = JSON.parse(stored);
    return {
      date: parsed.date ? new Date(parsed.date) : null,
      time: parsed.time || "",
      location: parsed.location,
    };
  } catch (e) {
    console.warn("[useTempBirthData] Failed to parse stored data:", e);
    return null;
  }
}

function saveToStorage(data: TempBirthData): void {
  try {
    const toStore: StoredData = {
      date: data.date?.toISOString() ?? null,
      time: data.time,
      location: data.location,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (e) {
    console.warn("[useTempBirthData] Failed to save data:", e);
  }
}

export function useTempBirthData() {
  const [tempData, setTempData] = useState<TempBirthData | null>(() =>
    loadFromStorage()
  );

  const saveTempData = useCallback((data: Partial<UserBirthData>) => {
    const newData: TempBirthData = {
      date: data.date ?? null,
      time: data.time ?? "",
      location: data.location ?? null,
    };
    setTempData(newData);
    saveToStorage(newData);
  }, []);

  const clearTempData = useCallback(() => {
    setTempData(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasTempData = !!(tempData?.date && tempData?.time);

  return {
    tempData,
    saveTempData,
    clearTempData,
    hasTempData,
  };
}
