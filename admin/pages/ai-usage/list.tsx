import React, { useState, useEffect } from "react";
import { GlassCard } from "../../../components/GlassCard";
import { supabase } from "../../../services/supabase";

type UsageStat = {
  date: string;
  request_type: string;
  request_count: number;
  unique_users: number;
  total_tokens: number;
  avg_latency_ms: number;
  fallback_count: number;
};

type DailySummary = {
  date: string;
  total_requests: number;
  total_tokens: number;
  unique_users: number;
  avg_latency: number;
  fallback_rate: number;
  by_type: Record<string, { count: number; tokens: number }>;
};

const REQUEST_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  daily_spark: { label: "Daily Spark", icon: "auto_awesome", color: "text-amber-400" },
  birth_chart: { label: "Birth Chart", icon: "public", color: "text-blue-400" },
  tarot: { label: "Tarot Reading", icon: "style", color: "text-purple-400" },
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const AIUsageList: React.FC = () => {
  const [stats, setStats] = useState<UsageStat[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(7); // days

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch from ai_usage_stats view
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      const { data, error: fetchError } = await supabase
        .from("ai_usage_stats")
        .select("*")
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setStats(data || []);

      // Process into daily summaries
      const summaryMap = new Map<string, DailySummary>();

      (data || []).forEach((stat: UsageStat) => {
        const dateKey = stat.date?.split("T")[0] || stat.date;
        let summary = summaryMap.get(dateKey);

        if (!summary) {
          summary = {
            date: dateKey,
            total_requests: 0,
            total_tokens: 0,
            unique_users: 0,
            avg_latency: 0,
            fallback_rate: 0,
            by_type: {},
          };
          summaryMap.set(dateKey, summary);
        }

        // TypeScript now knows summary is defined after the if block
        const s = summary;
        s.total_requests += stat.request_count;
        s.total_tokens += stat.total_tokens;
        s.unique_users = Math.max(s.unique_users, stat.unique_users);
        s.avg_latency = stat.avg_latency_ms;
        s.fallback_rate = stat.request_count > 0
          ? (stat.fallback_count / stat.request_count) * 100
          : 0;

        s.by_type[stat.request_type] = {
          count: stat.request_count,
          tokens: stat.total_tokens,
        };
      });

      setDailySummaries(Array.from(summaryMap.values()));
    } catch (err) {
      console.error("Failed to fetch AI usage stats:", err);
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals
  const totals = dailySummaries.reduce(
    (acc, day) => ({
      requests: acc.requests + day.total_requests,
      tokens: acc.tokens + day.total_tokens,
      users: Math.max(acc.users, day.unique_users),
    }),
    { requests: 0, tokens: 0, users: 0 }
  );

  // Calculate by type totals
  const byTypeTotals = stats.reduce((acc, stat) => {
    const type = stat.request_type;
    if (!acc[type]) {
      acc[type] = { count: 0, tokens: 0, fallbacks: 0 };
    }
    acc[type].count += stat.request_count;
    acc[type].tokens += stat.total_tokens;
    acc[type].fallbacks += stat.fallback_count;
    return acc;
  }, {} as Record<string, { count: number; tokens: number; fallbacks: number }>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted font-display animate-pulse">
          Loading AI usage data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <GlassCard className="p-6 text-center" intensity="low">
          <span className="material-symbols-outlined text-4xl text-red-400 mb-2 block">error</span>
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors"
          >
            Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
          AI Usage Monitor
        </h1>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="bg-background border border-surface-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button
            onClick={fetchStats}
            className="p-2 text-text-muted hover:text-foreground transition-colors"
            title="Refresh"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-6" intensity="low">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Requests</p>
              <p className="text-3xl font-light text-foreground">{formatNumber(totals.requests)}</p>
            </div>
            <span className="material-symbols-outlined text-2xl text-blue-400 opacity-50">query_stats</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6" intensity="low">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Tokens</p>
              <p className="text-3xl font-light text-foreground">{formatNumber(totals.tokens)}</p>
            </div>
            <span className="material-symbols-outlined text-2xl text-amber-400 opacity-50">token</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6" intensity="low">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Unique Users</p>
              <p className="text-3xl font-light text-foreground">{totals.users}</p>
            </div>
            <span className="material-symbols-outlined text-2xl text-green-400 opacity-50">group</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6" intensity="low">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Avg Tokens/Req</p>
              <p className="text-3xl font-light text-foreground">
                {totals.requests > 0 ? Math.round(totals.tokens / totals.requests) : 0}
              </p>
            </div>
            <span className="material-symbols-outlined text-2xl text-purple-400 opacity-50">analytics</span>
          </div>
        </GlassCard>
      </div>

      {/* By Type Breakdown */}
      <GlassCard className="p-6" intensity="low">
        <h2 className="text-lg font-display text-foreground mb-4">Usage by Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(REQUEST_TYPE_LABELS).map(([type, config]) => {
            const typeData = byTypeTotals[type] || { count: 0, tokens: 0, fallbacks: 0 };
            const fallbackRate = typeData.count > 0 ? ((typeData.fallbacks / typeData.count) * 100).toFixed(1) : "0";

            return (
              <div key={type} className="p-4 rounded-lg bg-surface-border/20 border border-surface-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`material-symbols-outlined ${config.color}`}>{config.icon}</span>
                  <span className="font-medium text-foreground">{config.label}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Requests</span>
                    <span className="text-foreground font-mono">{formatNumber(typeData.count)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Tokens</span>
                    <span className="text-foreground font-mono">{formatNumber(typeData.tokens)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Fallback Rate</span>
                    <span className={`font-mono ${Number(fallbackRate) > 5 ? "text-red-400" : "text-green-400"}`}>
                      {fallbackRate}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Daily Breakdown Table */}
      <GlassCard className="p-0 border-surface-border overflow-hidden" intensity="low">
        <div className="p-4 border-b border-surface-border">
          <h2 className="text-lg font-display text-foreground">Daily Breakdown</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-surface-border/30 border-b border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Requests</th>
              <th className="px-6 py-4">Tokens</th>
              <th className="px-6 py-4">Users</th>
              <th className="px-6 py-4">Latency</th>
              <th className="px-6 py-4">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {dailySummaries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                  <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">insights</span>
                  No usage data for this period
                </td>
              </tr>
            ) : (
              dailySummaries.map((day) => (
                <tr key={day.date} className="hover:bg-surface-border/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-foreground">{formatNumber(day.total_requests)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-amber-400">{formatNumber(day.total_tokens)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-foreground">{day.unique_users}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-mono ${day.avg_latency > 3000 ? "text-red-400" : "text-green-400"}`}>
                      {day.avg_latency}ms
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          day.fallback_rate < 5 ? "bg-green-400" : day.fallback_rate < 20 ? "bg-amber-400" : "bg-red-400"
                        }`}
                      />
                      <span className="text-xs text-text-muted">
                        {day.fallback_rate < 5 ? "Healthy" : day.fallback_rate < 20 ? "Degraded" : "Issues"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>

      {/* Info Footer */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Data from ai_usage_logs table</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-primary">info</span>
          Token costs vary by model and provider
        </span>
      </div>
    </div>
  );
};
