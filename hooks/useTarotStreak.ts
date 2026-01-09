import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useUser } from "../context/UserContext";
import type { TarotCard, LuckyElements } from "../services/ai/types";
import type { Json } from "../types/database";

// ============ 类型定义 ============

export interface TarotStats {
  currentStreak: number;
  longestStreak: number;
  totalReadings: number;
  lastReadingDate: string | null;
  recentCards: TarotCard[];
}

export interface RecordReadingResult {
  readingId: string;
  currentStreak: number;
  longestStreak: number;
  totalReadings: number;
  isNewStreak: boolean;
}

interface UseTarotStreakReturn {
  stats: TarotStats | null;
  loading: boolean;
  error: Error | null;
  recordReading: (
    readingType: "daily" | "three_card" | "celtic_cross",
    cards: TarotCard[],
    options?: {
      question?: string;
      interpretation?: string;
      coreMessage?: string;
      actionAdvice?: string;
      luckyElements?: LuckyElements;
      seed?: string;
    }
  ) => Promise<RecordReadingResult | null>;
  refetch: () => Promise<void>;
}

// ============ 缓存 ============

let statsCache: {
  userId: string;
  data: TarotStats;
  timestamp: number;
} | null = null;

const CACHE_TTL = 2 * 60 * 1000; // 2 分钟

// ============ Hook ============

export function useTarotStreak(): UseTarotStreakReturn {
  const { session } = useUser();
  const [stats, setStats] = useState<TarotStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const userId = session?.user?.id;

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    if (!userId) {
      setStats(null);
      setLoading(false);
      return;
    }

    // 检查缓存
    if (
      statsCache &&
      statsCache.userId === userId &&
      Date.now() - statsCache.timestamp < CACHE_TTL
    ) {
      setStats(statsCache.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc("get_tarot_stats", {
        p_user_id: userId,
      });

      if (rpcError) throw rpcError;

      const statsData: TarotStats = {
        currentStreak: data?.current_streak ?? 0,
        longestStreak: data?.longest_streak ?? 0,
        totalReadings: data?.total_readings ?? 0,
        lastReadingDate: data?.last_reading_date ?? null,
        recentCards: (data?.recent_cards ?? []) as unknown as TarotCard[],
      };

      // 更新缓存
      statsCache = {
        userId,
        data: statsData,
        timestamp: Date.now(),
      };

      setStats(statsData);
    } catch (err) {
      console.error("[useTarotStreak] Failed to fetch stats:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch stats"));
      // 返回默认值
      setStats({
        currentStreak: 0,
        longestStreak: 0,
        totalReadings: 0,
        lastReadingDate: null,
        recentCards: [],
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 记录阅读
  const recordReading = useCallback(
    async (
      readingType: "daily" | "three_card" | "celtic_cross",
      cards: TarotCard[],
      options?: {
        question?: string;
        interpretation?: string;
        coreMessage?: string;
        actionAdvice?: string;
        luckyElements?: LuckyElements;
        seed?: string;
      }
    ): Promise<RecordReadingResult | null> => {
      if (!userId) {
        console.warn("[useTarotStreak] Cannot record reading: not logged in");
        return null;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc(
          "record_tarot_reading",
          {
            p_user_id: userId,
            p_reading_type: readingType,
            p_cards: cards as unknown as Json,
            p_question: options?.question ?? null,
            p_interpretation: options?.interpretation ?? null,
            p_core_message: options?.coreMessage ?? null,
            p_action_advice: options?.actionAdvice ?? null,
            p_lucky_elements: (options?.luckyElements ?? null) as Json | null,
            p_seed: options?.seed ?? null,
          }
        );

        if (rpcError) throw rpcError;

        const result: RecordReadingResult = {
          readingId: data.reading_id,
          currentStreak: data.current_streak,
          longestStreak: data.longest_streak,
          totalReadings: data.total_readings,
          isNewStreak: data.is_new_streak,
        };

        // 清除缓存，强制下次刷新
        statsCache = null;

        // 更新本地状态
        const today = new Date().toISOString().split("T")[0] ?? null;
        setStats((prev) =>
          prev
            ? {
                ...prev,
                currentStreak: result.currentStreak,
                longestStreak: result.longestStreak,
                totalReadings: result.totalReadings,
                lastReadingDate: today,
              }
            : null
        );

        return result;
      } catch (err) {
        console.error("[useTarotStreak] Failed to record reading:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to record reading")
        );
        return null;
      }
    },
    [userId]
  );

  // 初始加载
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    recordReading,
    refetch: fetchStats,
  };
}

export default useTarotStreak;
