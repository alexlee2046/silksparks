import React, { useState, useEffect } from "react";
import { useList } from "@refinedev/core";
import { supabase } from "../../../services/supabase";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";
import toast from "react-hot-toast";

import { Authenticated } from "@refinedev/core";

export const SystemSettingsList: React.FC = () => {
  const { query } = useList({
    resource: "system_settings",
  });
  const { data: settings, isLoading, refetch } = query;

  const [isUpdating, setIsUpdating] = useState(false);

  // Local state for AI Config Form
  const [aiConfig, setAiConfig] = useState<any>({
    provider: "google",
    model: "google/gemini-2.0-flash-exp:free",
    openrouter_key: "",
    gemini_key: "",
    temperature: 0.7,
    max_tokens: 2048,
  });

  // Local state for other raw editors
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    if (settings?.data) {
      const remoteConfig = settings.data.find(
        (s: any) => s.key === "ai_config",
      )?.value;
      if (remoteConfig) {
        setAiConfig((prev: any) => ({ ...prev, ...remoteConfig }));
      }
    }
  }, [settings]);
  return (
    <Authenticated key="admin-settings-auth" fallback={null}>
      <SystemSettingsContent
        isLoading={isLoading}
        aiConfig={aiConfig}
        setAiConfig={setAiConfig}
        editingKey={editingKey}
        setEditingKey={setEditingKey}
        editValue={editValue}
        setEditValue={setEditValue}
        isUpdating={isUpdating}
        setIsUpdating={setIsUpdating}
        settings={settings}
        refetch={refetch}
      />
    </Authenticated>
  );
};

const SystemSettingsContent: React.FC<{
  isLoading: boolean;
  aiConfig: any;
  setAiConfig: any;
  editingKey: string | null;
  setEditingKey: any;
  editValue: string;
  setEditValue: any;
  isUpdating: boolean;
  setIsUpdating: any;
  settings: any;
  refetch: any;
}> = ({
  isLoading,
  aiConfig,
  setAiConfig,
  editingKey,
  setEditingKey,
  editValue,
  setEditValue,
  isUpdating,
  setIsUpdating,
  settings,
  refetch,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 font-display animate-pulse">
          Accessing Core Mainframe...
        </div>
      </div>
    );
  }

  const handleAiConfigChange = (field: string, value: any) => {
    setAiConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveAiConfig = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.from("system_settings").upsert(
        {
          key: "ai_config",
          value: aiConfig,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

      if (error) {
        console.error("Save error:", error);
        toast.error(`Failed to save: ${error.message}`);
      } else {
        toast.success("AI Engine settings updated successfully!");
        refetch();
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Generic handler for other JSON fields
  const handleEditRaw = (key: string, value: any) => {
    setEditingKey(key);
    setEditValue(
      typeof value === "object"
        ? JSON.stringify(value, null, 2)
        : String(value),
    );
  };

  const handleSaveRaw = async () => {
    if (!editingKey) return;
    setIsUpdating(true);
    try {
      const parsedValue = JSON.parse(editValue);
      const { error } = await supabase.from("system_settings").upsert(
        {
          key: editingKey,
          value: parsedValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

      if (error) {
        toast.error(`Failed to save: ${error.message}`);
      } else {
        toast.success("Settings saved successfully!");
        setEditingKey(null);
        refetch();
      }
    } catch (e) {
      toast.error("Invalid JSON format.");
    } finally {
      setIsUpdating(false);
    }
  };

  const aiPrompts = settings?.data.find((s: any) => s.key === "ai_prompts");
  const otherSettings =
    settings?.data.filter(
      (s: any) => s.key !== "ai_config" && s.key !== "ai_prompts",
    ) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-display font-light text-white tracking-tight">
        System Configuration
      </h1>

      {/* 1. Friendly AI Configuration Form */}
      <GlassCard className="p-8 border-white/5" intensity="low">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">
            psychology
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">AI Engine</h2>
            <p className="text-xs text-white/40">
              Manage LLM providers and model parameters.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* API Keys */}
          <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-white/5 rounded-xl border border-white/5">
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">
              Credentials
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                OpenRouter Key (Recommended)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={aiConfig.openrouter_key || ""}
                  onChange={(e) =>
                    handleAiConfigChange("openrouter_key", e.target.value)
                  }
                  placeholder="sk-or-v1-..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 pl-10 text-white font-mono text-sm focus:border-primary/50 outline-none transition-colors"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">
                  key
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Gemini Direct Key (Fallback)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={aiConfig.gemini_key || ""}
                  onChange={(e) =>
                    handleAiConfigChange("gemini_key", e.target.value)
                  }
                  placeholder="AIzaSy..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 pl-10 text-white font-mono text-sm focus:border-primary/50 outline-none transition-colors"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">
                  lock
                </span>
              </div>
            </div>
          </div>

          {/* Model Params */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Model ID
            </label>
            <input
              type="text"
              value={aiConfig.model}
              onChange={(e) => handleAiConfigChange("model", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-primary/50 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex justify-between">
              <span>Temperature</span>
              <span className="text-primary">{aiConfig.temperature}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={aiConfig.temperature}
              onChange={(e) =>
                handleAiConfigChange("temperature", parseFloat(e.target.value))
              }
              className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <GlowButton
            variant="primary"
            onClick={handleSaveAiConfig}
            disabled={isUpdating}
            icon="save"
          >
            {isUpdating ? "Saving..." : "Update Engine"}
          </GlowButton>
        </div>
      </GlassCard>

      {/* 2. AI Prompts Editor (Simple JSON/Textarea) */}
      {aiPrompts && (
        <GlassCard className="p-6 border-white/5" intensity="low">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">
                  chat
                </span>
                System Prompts
              </h3>
              <p className="text-xs text-white/40 mt-1">
                Customize persona instructions for each module.
              </p>
            </div>
          </div>

          {editingKey === "ai_prompts" ? (
            <div className="space-y-4">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={10}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary/50 outline-none transition-colors leading-relaxed"
              />
              <div className="flex justify-end gap-3">
                <GlowButton
                  variant="secondary"
                  onClick={() => setEditingKey(null)}
                >
                  Cancel
                </GlowButton>
                <GlowButton
                  variant="primary"
                  onClick={handleSaveRaw}
                  disabled={isUpdating}
                >
                  Save Prompts
                </GlowButton>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-xs text-white/70 overflow-x-auto max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(aiPrompts.value, null, 2)}
              </div>
              <div className="mt-4 flex justify-end">
                <GlowButton
                  variant="secondary"
                  icon="edit"
                  onClick={() => handleEditRaw("ai_prompts", aiPrompts.value)}
                >
                  Edit Prompts
                </GlowButton>
              </div>
            </>
          )}
        </GlassCard>
      )}

      {/* 3. Other Settings */}
      {otherSettings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white/50 uppercase tracking-widest pl-2">
            Misc Settings
          </h2>
          {otherSettings.map((setting: any) => (
            <GlassCard key={setting.key} className="p-6 border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold capitalize">
                  {setting.key.replace(/_/g, " ")}
                </h3>
                {editingKey !== setting.key && (
                  <button
                    onClick={() => handleEditRaw(setting.key, setting.value)}
                    className="text-primary text-sm hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              {editingKey === setting.key ? (
                <div className="space-y-4">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={4}
                    className="w-full bg-black/40 border-white/10 rounded-lg text-white font-mono text-sm p-3"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingKey(null)}
                      className="text-white/40 text-sm px-3 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveRaw}
                      className="text-primary text-sm px-3 py-1 font-bold"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <pre className="text-xs text-white/50 overflow-x-auto">
                  {JSON.stringify(setting.value, null, 2)}
                </pre>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
