import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useUser } from "../context/UserContext";
import type { ArchiveItem } from "../context/UserContext";

interface UseArchivesReturn {
  archives: ArchiveItem[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// In-memory cache
let archivesCache: {
  userId: string | null;
  data: ArchiveItem[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useArchives(): UseArchivesReturn {
  const { session } = useUser();
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const userId = session?.user?.id;

  const fetchArchives = useCallback(async () => {
    if (!userId) {
      setArchives([]);
      setLoading(false);
      return;
    }

    // Check cache validity
    if (
      archivesCache &&
      archivesCache.userId === userId &&
      Date.now() - archivesCache.timestamp < CACHE_TTL
    ) {
      setArchives(archivesCache.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("archives")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: ArchiveItem[] =
        data?.map((a) => ({
          id: a.id,
          id_db: a.id,
          type: a.type,
          date: new Date(a.created_at),
          title: a.title,
          summary: a.summary,
          content: a.content,
          image: a.image_url,
        })) || [];

      // Update cache
      archivesCache = {
        userId,
        data: mapped,
        timestamp: Date.now(),
      };

      setArchives(mapped);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch archives"));
      console.error("[useArchives] Error:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  const refetch = useCallback(async () => {
    // Invalidate cache
    archivesCache = null;
    await fetchArchives();
  }, [fetchArchives]);

  return { archives, loading, error, refetch };
}

// Helper to invalidate cache from outside (e.g., after adding a new archive)
export function invalidateArchivesCache() {
  archivesCache = null;
}
