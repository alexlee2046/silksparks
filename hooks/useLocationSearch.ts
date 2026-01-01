import { useState, useCallback, useRef, useEffect } from "react";
import {
  searchLocations,
  LocationResult,
} from "../services/LocationSearchService";

interface UseLocationSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseLocationSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: LocationResult[];
  isLoading: boolean;
  error: string | null;
  clearResults: () => void;
}

export function useLocationSearch(
  options: UseLocationSearchOptions = {}
): UseLocationSearchReturn {
  const { debounceMs = 300, minQueryLength = 2 } = options;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.trim().length < minQueryLength) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      // Cancel any pending request
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const locations = await searchLocations(searchQuery);
        setResults(locations);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError("Failed to search locations");
          console.error("Location search error:", err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [minQueryLength]
  );

  // Debounced search effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length < minQueryLength) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, debounceMs, minQueryLength, performSearch]);

  const clearResults = useCallback(() => {
    setResults([]);
    setQuery("");
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearResults,
  };
}
