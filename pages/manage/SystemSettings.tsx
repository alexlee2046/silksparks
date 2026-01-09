import React from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../../components/GlassCard";
import { supabase } from "../../services/supabase";
import toast from "react-hot-toast";
import { AdminLayout } from "./AdminLayout";
import type { AIConfig } from "./types";

export const SystemSettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [config, setConfig] = React.useState({
    systemPrompt:
      "You are SilkSpark AI, a mystical and empathetic guide. Your tone is warm, cosmic, and insightful. Use astrology and tarot metaphors where appropriate.",
    temperature: 0.7,
    openrouter_key: "",
    gemini_key: "",
    model: "google/gemini-2.0-flash-exp:free",
  });

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "ai_config")
      .maybeSingle();

    if (error) {
      console.error("[Admin] Failed to fetch AI settings:", error.message);
    } else if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
      const remoteConfig = data.value as Record<string, unknown>;
      setConfig((prev) => ({
        ...prev,
        ...(typeof remoteConfig.model === "string" ? { model: remoteConfig.model } : {}),
        ...(typeof remoteConfig.temperature === "number" ? { temperature: remoteConfig.temperature } : {}),
        ...(typeof remoteConfig.maxTokens === "number" ? { maxTokens: remoteConfig.maxTokens } : {}),
        ...(typeof remoteConfig.apiKey === "string" ? { apiKey: remoteConfig.apiKey } : {}),
      }));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      // Clean up sensitive keys if empty to avoid overwriting with empty string if desired,
      // but here we just save what's in the state.
      const { error } = await supabase.from("system_settings").upsert({
        key: "ai_config",
        value: config,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("AI Configuration saved successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error saving settings:", message);
      toast.error("Failed to save settings: " + message);
    }
  };

  const handleChange = (field: keyof AIConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout
      title="System Intelligence"
      navigate={navigate}
      onSave={handleSave}
      loading={loading}
    >
      <GlassCard className="p-8 border-surface-border">
        <h2 className="text-xl font-bold text-foreground mb-6 font-display flex items-center gap-2">
          <span className="text-primary">✦</span> AI Provider Configuration
        </h2>

        {/* API Keys Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-black/20 rounded-xl border border-surface-border">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
              OpenRouter API Key (Primary)
            </label>
            <div className="relative">
              <input
                type="password"
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors font-mono text-sm tracking-widest placeholder:text-text-muted"
                placeholder="sk-or-..."
                value={config.openrouter_key}
                onChange={(e) => handleChange("openrouter_key", e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted">
                key
              </span>
            </div>
            <p className="text-[10px] text-text-muted">
              Required for reliable generation & model switching.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
              Gemini Direct API Key (Backup)
            </label>
            <div className="relative">
              <input
                type="password"
                className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors font-mono text-sm tracking-widest placeholder:text-text-muted"
                placeholder="AIzaSy..."
                value={config.gemini_key}
                onChange={(e) => handleChange("gemini_key", e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted">
                lock
              </span>
            </div>
            <p className="text-[10px] text-text-muted">
              Fallback if OpenRouter is rate-limited (429).
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-6 font-display flex items-center gap-2">
          <span className="text-primary">✦</span> Core Personality
        </h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
              Target Model
            </label>
            <input
              type="text"
              className="w-full bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors font-mono text-sm"
              value={config.model}
              onChange={(e) => handleChange("model", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
              System Prompt (Persona)
            </label>
            <textarea
              className="w-full h-48 bg-black/40 border border-surface-border rounded-xl px-4 py-3 text-foreground outline-none focus:border-primary/50 transition-colors resize-none font-mono text-xs leading-relaxed"
              value={config.systemPrompt}
              onChange={(e) => handleChange("systemPrompt", e.target.value)}
            />
            <p className="text-[10px] text-text-muted text-right">
              {config.systemPrompt.length} characters
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">
                Creativity Temperature
              </label>
              <span className="text-primary font-bold text-sm">
                {config.temperature}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) =>
                handleChange("temperature", parseFloat(e.target.value))
              }
              className="w-full accent-primary h-1 bg-surface-border/30 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </GlassCard>
    </AdminLayout>
  );
};
