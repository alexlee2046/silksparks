import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useUser } from "../context/UserContext";
import type { FavoriteItem } from "../context/UserContext";

interface UseFavoritesReturn {
  favorites: FavoriteItem[];
  loading: boolean;
  error: Error | null;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number) => Promise<void>;
  refetch: () => Promise<void>;
}

// In-memory cache
let favoritesCache: {
  userId: string | null;
  data: FavoriteItem[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useFavorites(): UseFavoritesReturn {
  const { session } = useUser();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const userId = session?.user?.id;

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    // Check cache validity
    if (
      favoritesCache &&
      favoritesCache.userId === userId &&
      Date.now() - favoritesCache.timestamp < CACHE_TTL
    ) {
      setFavorites(favoritesCache.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId);

      if (fetchError) throw fetchError;

      const mapped: FavoriteItem[] =
        data?.map((f) => ({
          id: f.id,
          product_id: f.product_id,
          created_at: new Date(f.created_at),
        })) || [];

      // Update cache
      favoritesCache = {
        userId,
        data: mapped,
        timestamp: Date.now(),
      };

      setFavorites(mapped);
    } catch (e) {
      setError(
        e instanceof Error ? e : new Error("Failed to fetch favorites"),
      );
      console.error("[useFavorites] Error:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback(
    (productId: number) => {
      return favorites.some((f) => f.product_id === productId);
    },
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (productId: number) => {
      if (!userId) return;

      const existing = favorites.find((f) => f.product_id === productId);

      if (existing) {
        // Optimistic update - remove
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));

        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("id", existing.id);

        if (error) {
          // Rollback on error
          setFavorites((prev) => [...prev, existing]);
          console.error("[useFavorites] Error removing:", error);
        } else {
          // Invalidate cache
          favoritesCache = null;
        }
      } else {
        // Optimistic update - add (with temporary ID)
        const tempFavorite: FavoriteItem = {
          id: `temp-${Date.now()}`,
          product_id: productId,
          created_at: new Date(),
        };
        setFavorites((prev) => [...prev, tempFavorite]);

        const { data, error } = await supabase
          .from("favorites")
          .insert({
            user_id: userId,
            product_id: productId,
          })
          .select()
          .single();

        if (error || !data) {
          // Rollback on error
          setFavorites((prev) => prev.filter((f) => f.id !== tempFavorite.id));
          console.error("[useFavorites] Error adding:", error);
        } else {
          // Replace temp with real data
          setFavorites((prev) =>
            prev.map((f) =>
              f.id === tempFavorite.id
                ? {
                    id: data.id,
                    product_id: data.product_id,
                    created_at: new Date(data.created_at),
                  }
                : f,
            ),
          );
          // Invalidate cache
          favoritesCache = null;
        }
      }
    },
    [userId, favorites],
  );

  const refetch = useCallback(async () => {
    // Invalidate cache
    favoritesCache = null;
    await fetchFavorites();
  }, [fetchFavorites]);

  return { favorites, loading, error, isFavorite, toggleFavorite, refetch };
}

// Helper to invalidate cache from outside
export function invalidateFavoritesCache() {
  favoritesCache = null;
}
