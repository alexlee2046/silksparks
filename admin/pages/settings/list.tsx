import React, { useState } from "react";
import { useList, useUpdate } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const SystemSettingsList: React.FC = () => {
  // Standard Refine v4+ hook return might be wrapped or just different than expected
  // Using query object to access data safely based on error message
  const { query } = useList({
    resource: "system_settings",
  });
  // Destructure from the query result
  const { data: settings, isLoading, refetch } = query;

  // useUpdate return type fix
  const { mutate, mutation } = useUpdate(); // Access mutation object directly
  const isUpdating = mutation?.isPending; // Safely access isPending (v5)
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 font-display animate-pulse">
          Accessing Core Mainframe...
        </div>
      </div>
    );
  }

  const handleEdit = (key: string, value: any) => {
    setEditingKey(key);
    setEditValue(
      typeof value === "object"
        ? JSON.stringify(value, null, 2)
        : String(value),
    );
  };

  const handleSave = () => {
    if (!editingKey) return;
    try {
      const parsedValue = JSON.parse(editValue);
      mutate(
        {
          resource: "system_settings",
          id: editingKey,
          values: { value: parsedValue },
        },
        {
          onSuccess: () => {
            setEditingKey(null);
            refetch();
          },
        },
      );
    } catch (e) {
      alert("Invalid JSON format. Please check your input.");
    }
  };

  const getSettingIcon = (key: string) => {
    if (key.startsWith("ai_")) return "psychology";
    if (key === "payment_mode") return "payments";
    return "settings";
  };

  const getSettingDescription = (key: string) => {
    switch (key) {
      case "ai_config":
        return "Configure the AI model, provider, and generation parameters.";
      case "ai_prompts":
        return "Customize the system prompts used for Astrology, Tarot, and Daily insights.";
      case "payment_mode":
        return "Switch between test and live payment processing.";
      default:
        return "System configuration value.";
    }
  };

  // Separate AI settings from others
  const aiSettings =
    settings?.data.filter((s: any) => s.key.startsWith("ai_")) || [];
  const otherSettings =
    settings?.data.filter((s: any) => !s.key.startsWith("ai_")) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-display font-light text-white tracking-tight">
        System Configuration
      </h1>

      {/* AI Settings Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">
            psychology
          </span>
          <h2 className="text-xl font-bold text-white">AI Engine Settings</h2>
        </div>

        <div className="grid gap-6">
          {aiSettings.map((setting: any) => (
            <GlassCard
              key={setting.key}
              className="p-6 border-white/5"
              intensity="low"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">
                      {getSettingIcon(setting.key)}
                    </span>
                    {setting.key.replace(/_/g, " ")}
                  </h3>
                  <p className="text-xs text-white/40 mt-1">
                    {getSettingDescription(setting.key)}
                  </p>
                </div>
                <div className="text-xs text-white/20">
                  Updated: {new Date(setting.updated_at).toLocaleString()}
                </div>
              </div>

              {editingKey === setting.key ? (
                <div className="space-y-4">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={12}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary/50 outline-none transition-colors"
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
                      onClick={handleSave}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </GlowButton>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-sm text-primary/80 overflow-x-auto max-h-[300px] overflow-y-auto">
                    <pre>{JSON.stringify(setting.value, null, 2)}</pre>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <GlowButton
                      variant="secondary"
                      icon="edit"
                      onClick={() => handleEdit(setting.key, setting.value)}
                    >
                      Edit
                    </GlowButton>
                  </div>
                </>
              )}
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Other Settings Section */}
      {otherSettings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white/40">
              tune
            </span>
            <h2 className="text-xl font-bold text-white">Other Settings</h2>
          </div>

          <div className="grid gap-6">
            {otherSettings.map((setting: any) => (
              <GlassCard
                key={setting.key}
                className="p-6 border-white/5"
                intensity="low"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
                      <span className="material-symbols-outlined text-white/40 text-sm">
                        {getSettingIcon(setting.key)}
                      </span>
                      {setting.key.replace(/_/g, " ")}
                    </h3>
                    <p className="text-xs text-white/40 mt-1">
                      {getSettingDescription(setting.key)}
                    </p>
                  </div>
                  <div className="text-xs text-white/20">
                    Updated: {new Date(setting.updated_at).toLocaleString()}
                  </div>
                </div>

                {editingKey === setting.key ? (
                  <div className="space-y-4">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={6}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary/50 outline-none transition-colors"
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
                        onClick={handleSave}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Saving..." : "Save Changes"}
                      </GlowButton>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-sm text-primary/80 overflow-x-auto">
                      <pre>{JSON.stringify(setting.value, null, 2)}</pre>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <GlowButton
                        variant="secondary"
                        icon="edit"
                        onClick={() => handleEdit(setting.key, setting.value)}
                      >
                        Edit
                      </GlowButton>
                    </div>
                  </>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
