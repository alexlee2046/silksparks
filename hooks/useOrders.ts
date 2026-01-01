import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useUser } from "../context/UserContext";
import type { Order } from "../context/UserContext";

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// In-memory cache
let ordersCache: {
  userId: string | null;
  data: Order[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useOrders(): UseOrdersReturn {
  const { session } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const userId = session?.user?.id;

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Check cache validity
    if (
      ordersCache &&
      ordersCache.userId === userId &&
      Date.now() - ordersCache.timestamp < CACHE_TTL
    ) {
      setOrders(ordersCache.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: Order[] =
        data?.map((o) => ({
          id: o.id,
          id_db: o.id,
          date: new Date(o.created_at),
          items:
            o.order_items?.map((oi: any) => ({
              name: oi.name,
              price: oi.price,
              type: oi.type,
              status: o.status,
              image: oi.image_url,
            })) || [],
          total: o.total,
          status: o.status as Order["status"],
        })) || [];

      // Update cache
      ordersCache = {
        userId,
        data: mapped,
        timestamp: Date.now(),
      };

      setOrders(mapped);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch orders"));
      console.error("[useOrders] Error:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const refetch = useCallback(async () => {
    // Invalidate cache
    ordersCache = null;
    await fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch };
}

// Helper to invalidate cache from outside (e.g., after adding a new order)
export function invalidateOrdersCache() {
  ordersCache = null;
}
