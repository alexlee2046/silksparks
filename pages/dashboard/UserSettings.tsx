import React from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { useUser } from "../../context/UserContext";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/GlassCard";
import { GlowButton } from "../../components/GlowButton";
import toast from "react-hot-toast";
import { useTheme, type Theme } from "../../context/ThemeContext";
import { useLanguage, LOCALE_NAMES, type Locale } from "../../context/LanguageContext";
import { usePerformance, type QualityLevel } from "../../context/PerformanceContext";
import * as m from "../../src/paraglide/messages";

export const UserSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useUser();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, locales } = useLanguage();
  const { qualityLevel, setQualityLevel } = usePerformance();
  const [marketing, setMarketing] = React.useState(
    user.preferences?.marketingConsent || false,
  );
  const [loading, setLoading] = React.useState(false);

  const handleSave = async () => {
    setLoading(true);
    await updateUser({
      preferences: { ...user.preferences, marketingConsent: marketing },
    });
    setLoading(false);
    toast.success(m["settings.save"]());
  };

  const themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: "light", label: m["theme.light"](), icon: "light_mode" },
    { value: "dark", label: m["theme.dark"](), icon: "dark_mode" },
    { value: "system", label: m["theme.system"](), icon: "devices" },
  ];

  const qualityOptions: { value: QualityLevel; label: string; desc: string }[] = [
    { value: "high", label: m["settings.performance.high"](), desc: m["settings.performance.highDesc"]() },
    { value: "medium", label: m["settings.performance.medium"](), desc: m["settings.performance.mediumDesc"]() },
    { value: "low", label: m["settings.performance.low"](), desc: m["settings.performance.lowDesc"]() },
    { value: "off", label: m["settings.performance.off"](), desc: m["settings.performance.offDesc"]() },
  ];

  return (
    <div className="flex-1 p-4 md:p-10 bg-background min-h-screen relative">
      <button
        onClick={() => navigate(PATHS.DASHBOARD)}
        className="text-text-muted hover:text-foreground mb-8 flex items-center gap-2 transition-colors group text-sm font-medium"
      >
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>{" "}
        {m["settings.backToDashboard"]()}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-light font-display text-foreground">
          {m["settings.title"]()}
        </h1>
        <p className="text-text-muted font-light">
          {m["settings.subtitle"]()}
        </p>
      </motion.div>

      <div className="max-w-2xl space-y-6">
        {/* Theme Settings */}
        <GlassCard className="p-6 border-surface-border">
          <div className="mb-4">
            <h3 className="text-foreground font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">palette</span>
              {m["settings.appearance.title"]()}
            </h3>
            <p className="text-text-muted text-sm mt-1">
              {m["settings.appearance.description"]()}
            </p>
          </div>
          <div className="flex gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  theme === opt.value
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface-border/30 border-surface-border text-text-muted hover:border-foreground/30"
                }`}
              >
                <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Language Settings */}
        <GlassCard className="p-6 border-surface-border">
          <div className="mb-4">
            <h3 className="text-foreground font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">translate</span>
              {m["settings.language.title"]()}
            </h3>
            <p className="text-text-muted text-sm mt-1">
              {m["settings.language.description"]()}
            </p>
          </div>
          <div className="flex gap-3">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocale(loc as Locale)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  locale === loc
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface-border/30 border-surface-border text-text-muted hover:border-foreground/30"
                }`}
              >
                <span className="text-2xl">{loc === "en" ? "🇺🇸" : "🇨🇳"}</span>
                <span className="text-sm font-medium">{LOCALE_NAMES[loc as Locale].native}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Performance Settings */}
        <GlassCard className="p-6 border-surface-border">
          <div className="mb-4">
            <h3 className="text-foreground font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">speed</span>
              {m["settings.performance.title"]()}
            </h3>
            <p className="text-text-muted text-sm mt-1">
              {m["settings.performance.description"]()}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {qualityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setQualityLevel(opt.value)}
                className={`flex flex-col items-center gap-1 p-4 rounded-xl border transition-all ${
                  qualityLevel === opt.value
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface-border/30 border-surface-border text-text-muted hover:border-foreground/30"
                }`}
              >
                <span className="text-sm font-bold">{opt.label}</span>
                <span className="text-[10px] text-center opacity-60">{opt.desc}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Marketing Settings */}
        <GlassCard className="p-6 border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-foreground font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">mail</span>
                {m["settings.marketing.title"]()}
              </h3>
              <p className="text-text-muted text-sm mt-1">
                {m["settings.marketing.description"]()}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
              <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </GlassCard>

        {/* Save Button */}
        <div className="pt-4">
          <GlowButton onClick={handleSave} disabled={loading}>
            {loading ? m["settings.saving"]() : m["settings.save"]()}
          </GlowButton>
        </div>
      </div>
    </div>
  );
};
