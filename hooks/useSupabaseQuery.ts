import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../services/supabase";

// Cache storage
const queryCache = new Map<string, { data: unknown[]; timestamp: number }>();

export interface UseSupabaseQueryOptions<TRow, TResult = TRow> {
  /** Table name to query */
  table: string;
  /** Select clause (default: "*") */
  select?: string;
  /** Apply filters to the query - receives the query builder and should return it with filters applied */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: (query: any) => any;
  /** Order results */
  orderBy?: { column: string; ascending?: boolean };
  /** Transform raw data to desired shape */
  transform?: (data: TRow[]) => TResult[];
  /** Whether to execute the query (default: true) */
  enabled?: boolean;
  /** Cache key for this query (enables caching if provided) */
  cacheKey?: string;
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTTL?: number;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Success callback */
  onSuccess?: (data: TResult[]) => void;
}

export interface UseSupabaseQueryReturn<TResult> {
  data: TResult[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generic hook for Supabase queries with optional caching
 *
 * @example Simple query
 * ```tsx
 * const { data: experts, loading } = useSupabaseQuery<Expert>({
 *   table: "experts",
 *   orderBy: { column: "rating", ascending: false }
 * });
 * ```
 *
 * @example With filter and cache
 * ```tsx
 * const { data: orders, loading, refetch } = useSupabaseQuery<Order>({
 *   table: "orders",
 *   select: "*, order_items(*)",
 *   filter: (q) => q.eq("user_id", userId),
 *   orderBy: { column: "created_at", ascending: false },
 *   cacheKey: `orders-${userId}`,
 *   enabled: !!userId
 * });
 * ```
 */
export function useSupabaseQuery<TRow, TResult = TRow>(
  options: UseSupabaseQueryOptions<TRow, TResult>
): UseSupabaseQueryReturn<TResult> {
  const {
    table,
    select = "*",
    filter,
    orderBy,
    transform,
    enabled = true,
    cacheKey,
    cacheTTL = DEFAULT_CACHE_TTL,
    onError,
    onSuccess,
  } = options;

  const [data, setData] = useState<TResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Stabilize callback refs to prevent infinite re-render loops
  // when callers pass inline functions (e.g. onError: () => toast.error(...))
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  // Serialize orderBy to a stable string so inline objects don't cause re-renders
  const orderByKey = useMemo(
    () => (orderBy ? `${orderBy.column}:${orderBy.ascending ?? true}` : ""),
    [orderBy?.column, orderBy?.ascending]
  );

  const fetchData = useCallback(async (skipCache = false) => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }

    // Check cache if cacheKey is provided and not skipping
    if (cacheKey && !skipCache) {
      const cached = queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        const currentTransform = transformRef.current;
        const result = (currentTransform ? currentTransform(cached.data as TRow[]) : cached.data) as TResult[];
        setData(result);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase.from(table).select(select);

      // Apply filter if provided
      const currentFilter = filterRef.current;
      if (currentFilter) {
        query = currentFilter(query);
      }

      // Apply ordering if provided
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      const { data: rawData, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!isMounted.current) return;

      const rows = (rawData ?? []) as TRow[];
      const currentTransform = transformRef.current;
      const result = currentTransform ? currentTransform(rows) : (rows as unknown as TResult[]);

      // Update cache if cacheKey is provided
      if (cacheKey) {
        queryCache.set(cacheKey, {
          data: rows,
          timestamp: Date.now(),
        });
      }

      setData(result);
      onSuccessRef.current?.(result);
    } catch (e) {
      if (!isMounted.current) return;

      const err = e instanceof Error ? e : new Error("Failed to fetch data");
      setError(err);
      onErrorRef.current?.(err);
      console.error(`[useSupabaseQuery] Error fetching ${table}:`, err.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, select, orderByKey, enabled, cacheKey, cacheTTL]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  const refetch = useCallback(async () => {
    // Invalidate cache for this key
    if (cacheKey) {
      queryCache.delete(cacheKey);
    }
    await fetchData(true);
  }, [cacheKey, fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Invalidate a specific cache entry
 */
export function invalidateQueryCache(cacheKey: string): void {
  queryCache.delete(cacheKey);
}

/**
 * Invalidate all cache entries matching a prefix
 */
export function invalidateQueryCachePrefix(prefix: string): void {
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Clear the entire query cache
 */
export function clearQueryCache(): void {
  queryCache.clear();
}
