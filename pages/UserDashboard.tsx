import React from "react";
import { useUser } from "../context/UserContext";
import { Screen, NavProps } from "../types";
import { motion } from "framer-motion";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";
import { ProductCard } from "./Home";
import { useCart } from "../context/CartContext";
import { useTheme, type Theme } from "../context/ThemeContext";
import { useLanguage, LOCALE_NAMES, type Locale } from "../context/LanguageContext";
import { usePerformance, type QualityLevel } from "../context/PerformanceContext";
import * as m from "../src/paraglide/messages";

export const UserDashboard: React.FC<NavProps> = ({ setScreen }) => {
  const { user, signOut } = useUser();
  const userName = user.name || "Seeker";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Successfully signed out");
    setScreen(Screen.HOME);
  };

  return (
    <div className="flex min-h-screen w-full flex-row bg-background">
      <motion.aside
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:flex w-56 lg:w-72 flex-col justify-between border-r border-surface-border bg-surface p-4 lg:p-6 sticky top-0 h-screen overflow-y-auto z-10"
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_15px_rgba(244,192,37,0.2)]">
              <span className="material-symbols-outlined text-3xl">
                auto_awesome
              </span>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-display">
              Silk & Spark
            </span>
          </div>

          <GlassCard
            className="flex flex-col gap-4 p-4 border-surface-border"
            intensity="low"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-cover bg-center ring-2 ring-primary/20 flex items-center justify-center bg-surface-border text-foreground font-bold text-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-amber-500 opacity-20"></div>
                {userName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-foreground">{userName}</h3>
                <span className="text-xs text-primary font-medium tracking-wide flex items-center gap-1">
                  Premium Member{" "}
                  <span className="material-symbols-outlined text-[10px]">
                    verified
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setScreen(Screen.BIRTH_CHART)}
              className="flex items-center gap-2 rounded-lg bg-surface-border/30 hover:bg-surface-border/50 px-3 py-2 transition-colors group w-full border border-surface-border"
            >
              <span className="material-symbols-outlined text-[18px] text-primary group-hover:rotate-45 transition-transform">
                star
              </span>
              <span className="text-xs font-medium text-foreground">
                Unlock Full Chart
              </span>
            </button>
          </GlassCard>

          <nav className="flex flex-col gap-2">
            <NavBtn
              icon="dashboard"
              label="My Space"
              active
              onClick={() => setScreen(Screen.USER_DASHBOARD)}
            />
            <NavBtn
              icon="description"
              label="Digital Archives"
              onClick={() => setScreen(Screen.ARCHIVES)}
            />
            <NavBtn
              icon="shopping_bag"
              label="Order History"
              onClick={() => setScreen(Screen.ORDERS)}
            />
            <NavBtn
              icon="favorite"
              label="Favorites"
              onClick={() => setScreen(Screen.FAVORITES)}
            />
            <NavBtn
              icon="calendar_month"
              label="Consultations"
              onClick={() => setScreen(Screen.CONSULTATIONS)}
            />
            <NavBtn
              icon="settings"
              label="Settings"
              onClick={() => setScreen(Screen.SETTINGS)}
            />
          </nav>
        </div>
        <div className="flex flex-col gap-2">
          <NavBtn icon="logout" label="Sign Out" onClick={handleSignOut} />
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-background p-4 md:p-8 lg:p-12 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
        <div className="flex flex-col gap-1 mb-10 relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-foreground text-3xl md:text-4xl font-bold tracking-tight font-display"
          >
            My Cosmic Space
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-text-muted"
          >
            Welcome back, {userName}. The stars are aligning for you.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 relative z-10">
          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-12 lg:col-span-8"
          >
            <GlassCard
              className="p-8 h-full relative overflow-hidden border-primary/20"
              intensity="medium"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10 h-full">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col">
                    <span className="text-text-muted text-xs uppercase tracking-widest font-medium mb-1">
                      Current Tier
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">
                        verified
                      </span>
                      <span className="text-2xl text-foreground font-bold font-display">
                        {user.tier || "Star Walker"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-text-muted text-xs uppercase tracking-widest font-medium mb-1">
                      Spark Points
                    </span>
                    <span className="text-3xl text-primary font-bold font-display">
                      {user.points?.toLocaleString() || 0}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm max-w-sm">
                    You are{" "}
                    <span className="text-foreground font-bold">
                      {1000 - (user.points || 0)} points
                    </span>{" "}
                    away from ascending to the "Nebula Navigator" tier.
                  </p>
                  <div className="w-full bg-surface-border rounded-full h-2 mt-4">
                    <div
                      className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(((user.points || 0) / 1000) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-text-muted mt-2 font-medium">
                    <span>{user.points || 0} / 1000 to next tier</span>
                    <span>Nebula Navigator</span>
                  </div>
                </div>
                <GlowButton
                  variant="cosmic"
                  icon="diamond"
                  className="mt-4 sm:mt-0"
                  onClick={() =>
                    toast(
                      "Rewards redemption coming soon! Stay tuned for exciting rewards.",
                      { icon: "✨" },
                    )
                  }
                >
                  Redeem Rewards
                </GlowButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* Daily Insight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-12 lg:col-span-4"
          >
            <GlassCard
              className="p-8 h-full flex flex-col justify-between bg-gradient-to-br from-surface to-background border-surface-border"
              hoverEffect
              interactive
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-foreground font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      auto_awesome
                    </span>{" "}
                    Daily Insight
                  </h3>
                </div>
                <p className="text-foreground/90 text-lg leading-relaxed italic font-light">
                  "The alignment today favors bold communication. Speak your
                  truth, but temper it with empathy."
                </p>
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-surface-border pt-4">
                <span className="text-xs text-text-muted font-bold uppercase tracking-widest">
                  TODAY
                </span>
                <button
                  onClick={() => setScreen(Screen.REPORT)}
                  className="text-primary text-sm font-bold hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  Read Full{" "}
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
          <DashboardCard
            title="Archives"
            icon="history_edu"
            value={user.archives?.length || 0}
            label="Reports"
            color="from-blue-500 to-indigo-500"
            onClick={() => setScreen(Screen.ARCHIVES)}
          />
          <DashboardCard
            title="Favorites"
            icon="favorite"
            value={user.favorites?.length || 0}
            label="Saved Items"
            color="from-red-400 to-pink-600"
            onClick={() => setScreen(Screen.FAVORITES)}
          />
        </div>
      </main>
    </div>
  );
};

export const Orders: React.FC<NavProps> = ({ setScreen }) => {
  return (
    <div className="flex-1 p-4 md:p-10 bg-background min-h-screen relative">
      <button
        onClick={() => setScreen(Screen.USER_DASHBOARD)}
        className="text-text-muted hover:text-foreground mb-8 flex items-center gap-2 transition-colors group text-sm font-medium"
      >
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>{" "}
        Back to Dashboard
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-light font-display text-foreground">
          Order <span className="font-bold text-primary">History</span>
        </h1>
        <p className="text-text-muted font-light">
          Track your physical artifacts and deliveries.
        </p>
      </motion.div>

      <GlassCard className="text-center py-20 border-dashed border-surface-border bg-transparent flex flex-col items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-surface-border/30 flex items-center justify-center text-text-muted mb-4">
          <span className="material-symbols-outlined text-3xl">
            local_shipping
          </span>
        </div>
        <p className="text-text-muted">No orders placed yet.</p>
        <button
          onClick={() => setScreen(Screen.SHOP_LIST)}
          className="text-primary mt-4 hover:text-foreground font-bold text-sm tracking-wide border-b border-primary/30 pb-0.5 hover:border-foreground transition-all"
        >
          Browse Shop
        </button>
      </GlassCard>
    </div>
  );
};

function NavBtn({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${active ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(244,192,37,0.1)]" : "text-text-muted hover:bg-surface-border/30 hover:text-foreground border border-transparent"}`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

export const Archives: React.FC<NavProps> = ({ setScreen }) => {
  const { user } = useUser();
  const archives = user.archives || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  return (
    <div className="flex-1 p-4 md:p-10 bg-background min-h-screen relative">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

      <button
        onClick={() => setScreen(Screen.USER_DASHBOARD)}
        className="relative z-10 text-text-muted hover:text-foreground mb-8 flex items-center gap-2 transition-colors group text-sm font-medium"
      >
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>{" "}
        Back to Dashboard
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col gap-3 mb-10 text-center md:text-left"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-border/30 border border-surface-border text-xs font-bold uppercase tracking-widest text-primary w-fit mx-auto md:mx-0">
          <span className="material-symbols-outlined text-[14px]">
            history_edu
          </span>{" "}
          Journal
        </div>
        <h1 className="text-4xl md:text-5xl font-light font-display text-foreground">
          Digital{" "}
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
            Archives
          </span>
        </h1>
        <p className="text-text-muted text-lg font-light">
          Revisit your cosmic journey and personalized insights.
        </p>
      </motion.div>

      {archives.length === 0 ? (
        <GlassCard className="text-center py-24 flex flex-col items-center justify-center gap-4 border-dashed border-surface-border bg-transparent">
          <div className="h-20 w-20 rounded-full bg-surface-border/30 flex items-center justify-center text-text-muted mb-2">
            <span className="material-symbols-outlined text-4xl">
              auto_stories
            </span>
          </div>
          <h3 className="text-foreground font-bold text-lg">
            Your spiritual journal is empty
          </h3>
          <p className="text-text-muted max-w-sm">
            Readings and reports you save will appear here for your reflection.
          </p>
        </GlassCard>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10"
        >
          {archives.map((item, idx) => (
            <ArchiveCard key={item.id || idx} item={item} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

const ArchiveCard = ({ item }: { item: any; key?: any }) => {
  const bgImage =
    item.image ||
    (item.type === "Astrology"
      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCuy6mtv7iJE3VcfRhDjshoTaD7dUQNqLN1FRvSfpDZf4kZ2S8h90DxDlmIBG7ZTSRaaL66gwwIKpSvJPx81j6QYk0trYBVRmtqIlQfvIDotCaERWFsoUXcjb1aOtCIN2kkaZ-TNzojTtqHs19J8HAbICH7sbBKRr2hANVGOpM2wbqSbDSxhawtuH41k4j2yUVlqEdXGEA8lOaDSa5G7wrDW_hfKT-ZtmZVviS_B6qcElXYkZo6w3CDAxguO77b3SihJkXmj1mxOYv1"
      : "https://lh3.googleusercontent.com/aida-public/AB6AXuDnPk-u1Prw-XJ1l5IJ9mPRdwMJ-CMC9GP4ODzh2wtTQcvRL2Wa_7yo29WR419eE5D3XTACDr4fgRmNbbw9JLocAoItNkw0Iu_M5goh5OTlX-ZTuQ-aWMzpKOIv2HppNVRx8k6Yd3tVfI6FpNrl8FofeyamwOc7yW_OZRQLhLqhl5x8ke_TGUMSlT3ZXWmo3vOZMEHZuoxSHarMJk7uDMq0fwNnL2NhpTJdEEyRkNax5nyU_ElrNXDzunABIue0uMya1q7-ZEt8bHC");

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      <GlassCard
        hoverEffect
        interactive
        className="flex flex-col h-full overflow-hidden p-0 border-surface-border group"
      >
        <div
          className="h-48 bg-cover bg-center relative group-hover:scale-105 transition-transform duration-700"
          style={{ backgroundImage: `url('${bgImage}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-90"></div>
          <div className="absolute top-4 left-4 bg-surface/80 backdrop-blur-md px-3 py-1 rounded-full border border-surface-border flex items-center gap-2 shadow-lg">
            <span className="material-symbols-outlined text-primary text-[14px]">
              {item.type === "Tarot" ? "style" : "auto_awesome"}
            </span>
            <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">
              {item.type}
            </span>
          </div>
        </div>
        <div className="p-6 flex flex-col flex-1 relative bg-surface border-t border-surface-border">
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 font-display">
            {item.title}
          </h3>
          <p className="text-xs text-text-muted mb-4 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">
              calendar_today
            </span>
            {new Date(item.date).toLocaleDateString()}
          </p>
          <p className="text-sm text-text-muted mb-6 line-clamp-3 leading-relaxed font-light">
            {item.summary}
          </p>
          <div className="mt-auto pt-4 border-t border-surface-border">
            <button className="w-full text-foreground text-sm font-bold flex items-center justify-between group/btn hover:text-primary transition-colors">
              Read Full Entry
              <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export const UserSettings: React.FC<NavProps> = ({ setScreen }) => {
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
        onClick={() => setScreen(Screen.USER_DASHBOARD)}
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

export const Consultations: React.FC<NavProps> = ({ setScreen }) => {
  const { user } = useUser();
  const [consultations, setConsultations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchConsultations = async () => {
      // Fetch from appointments table which holds the actual bookings
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          experts (
            name,
            image_url
          ),
          consultations (
            name,
            duration
          )
        `,
        )
        .eq("user_id", user.id)
        .order("booked_at", { ascending: false });

      if (!error && data) {
        setConsultations(data);
      }
      setLoading(false);
    };
    if (user.id) fetchConsultations();
  }, [user.id]);

  return (
    <div className="flex-1 p-4 md:p-10 bg-background min-h-screen relative">
      <button
        onClick={() => setScreen(Screen.USER_DASHBOARD)}
        className="text-text-muted hover:text-foreground mb-8 flex items-center gap-2 transition-colors group text-sm font-medium"
      >
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>{" "}
        Back to Dashboard
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-light font-display text-foreground">
          My <span className="font-bold text-primary">Consultations</span>
        </h1>
        <p className="text-text-muted font-light">
          Upcoming sessions and past guidance.
        </p>
      </motion.div>

      {consultations.length === 0 ? (
        <GlassCard className="text-center py-20 border-dashed border-surface-border bg-transparent flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-surface-border/30 flex items-center justify-center text-text-muted mb-4">
            <span className="material-symbols-outlined text-3xl">
              calendar_month
            </span>
          </div>
          <p className="text-text-muted">No consultations booked yet.</p>
          <button
            onClick={() => setScreen(Screen.BOOKING)}
            className="text-primary mt-4 hover:text-foreground font-bold text-sm tracking-wide border-b border-primary/30 pb-0.5 hover:border-foreground transition-all"
          >
            Book a Session
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {consultations.map((c) => (
            <GlassCard
              key={c.id}
              className="p-6 border-surface-border flex flex-col md:flex-row gap-6 items-start md:items-center"
            >
              <div
                className="h-16 w-16 rounded-full bg-cover bg-center border border-surface-border"
                style={{ backgroundImage: `url('${c.experts?.image_url}')` }}
              ></div>
              <div className="flex-1">
                <h3 className="text-foreground font-bold text-lg">
                  {c.consultations?.name || "Consultation"} with{" "}
                  {c.experts?.name}
                </h3>
                <p className="text-text-muted text-sm flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-xs">
                    event
                  </span>
                  {new Date(c.booked_at).toLocaleString()}
                </p>
                {c.meeting_link && (
                  <a
                    href={c.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-xs font-bold uppercase tracking-wider mt-2 block hover:underline"
                  >
                    Join Meeting
                  </a>
                )}
              </div>
              <div className="px-3 py-1 rounded-full bg-surface-border/30 border border-surface-border text-xs font-bold uppercase tracking-widest text-text-muted">
                {c.status}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

const Favorites: React.FC<NavProps> = ({ setScreen }) => {
  const { user, toggleFavorite } = useUser();
  const { addToCart } = useCart();
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFavorites = async () => {
      if (!user.favorites || user.favorites.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const ids = user.favorites.map((f) => f.product_id);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", ids);

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [user.favorites]);

  return (
    <div className="flex-1 p-4 md:p-10 bg-background min-h-screen relative">
      <button
        onClick={() => setScreen(Screen.USER_DASHBOARD)}
        className="text-text-muted hover:text-foreground mb-8 flex items-center gap-2 transition-colors group text-sm font-medium"
      >
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>{" "}
        Back to Dashboard
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-light font-display text-foreground">
          My <span className="font-bold text-primary">Favorites</span>
        </h1>
        <p className="text-text-muted font-light">Saved artifacts and tools.</p>
      </motion.div>

      {products.length === 0 && !loading ? (
        <GlassCard className="text-center py-20 border-dashed border-surface-border bg-transparent flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-surface-border/30 flex items-center justify-center text-text-muted mb-4">
            <span className="material-symbols-outlined text-3xl">favorite</span>
          </div>
          <p className="text-text-muted">No favorites yet.</p>
          <button
            onClick={() => setScreen(Screen.SHOP_LIST)}
            className="text-primary mt-4 hover:text-foreground font-bold text-sm tracking-wide border-b border-primary/30 pb-0.5 hover:border-foreground transition-all"
          >
            Browse Shop
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              {...product}
              index={index}
              isFavorited={true}
              onToggleFavorite={() => toggleFavorite(product.id)}
              onClick={() => {
                // Navigation to detail not fully established here passed props,
                // simplifying to just toast for now or basic view
              }}
              onAddToCart={() => {
                addToCart({ ...product, type: "product" });
                toast.success(`Added ${product.title} to cart`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function DashboardCard({
  title,
  icon,
  value,
  label,
  color,
  onClick,
}: {
  title: string;
  icon: string;
  value: number | string;
  label: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="md:col-span-6 lg:col-span-4 cursor-pointer"
      onClick={onClick}
    >
      <GlassCard className="p-6 h-full flex flex-col justify-between border-surface-border hover:border-primary/30 transition-colors group">
        <div className="flex justify-between items-start mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${color} bg-opacity-10`}
          >
            <span className="material-symbols-outlined text-foreground text-xl">
              {icon}
            </span>
          </div>
          <div className="h-8 w-8 rounded-full bg-surface-border/30 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </div>
        </div>
        <div>
          <h3 className="text-text-muted text-sm font-medium uppercase tracking-wider mb-1">
            {title}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground font-display">
              {value}
            </span>
            <span className="text-xs text-text-muted">{label}</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
