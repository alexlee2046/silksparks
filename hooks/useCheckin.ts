import { useState, useEffect, useCallback } from "react";
import { CheckinService, CheckinResult } from "../services/CheckinService";
import { useUser } from "../context/UserContext";

interface UseCheckinReturn {
  isLoading: boolean;
  hasCheckedInToday: boolean;
  currentStreak: number;
  checkinHistory: Date[];
  checkin: () => Promise<CheckinResult | null>;
  refreshStatus: () => Promise<void>;
}

export function useCheckin(): UseCheckinReturn {
  const { session } = useUser();
  const userId = session?.user?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [checkinHistory, setCheckinHistory] = useState<Date[]>([]);

  const refreshStatus = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [checked, streak, history] = await Promise.all([
        CheckinService.hasCheckedInToday(userId),
        CheckinService.getCurrentStreak(userId),
        CheckinService.getCheckinHistory(userId),
      ]);

      setHasCheckedInToday(checked);
      setCurrentStreak(streak);
      setCheckinHistory(history);
    } catch (error) {
      console.error("[useCheckin] Error refreshing status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const checkin = useCallback(async (): Promise<CheckinResult | null> => {
    if (!userId) return null;

    const result = await CheckinService.checkin(userId);

    if (result.success) {
      setHasCheckedInToday(true);
      setCurrentStreak(result.streakDays);
      const history = await CheckinService.getCheckinHistory(userId);
      setCheckinHistory(history);
    }

    return result;
  }, [userId]);

  return {
    isLoading,
    hasCheckedInToday,
    currentStreak,
    checkinHistory,
    checkin,
    refreshStatus,
  };
}
