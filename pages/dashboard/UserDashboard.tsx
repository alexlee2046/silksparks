import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { useUser } from "../../context/UserContext";
import AIService from "../../services/ai";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/GlassCard";
import { GlowButton } from "../../components/GlowButton";
import toast from "react-hot-toast";
import { NavBtn } from "./NavBtn";
import { DashboardCard } from "./DashboardCard";
import { CheckinModal } from "../../components/CheckinModal";
import { useCheckin } from "../../hooks/useCheckin";

// Helper function to get sun sign from birth date
function getSunSign(birthDate: Date): string {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

// Default insight for fallback
const DEFAULT_INSIGHT = "The alignment today favors bold communication. Speak your truth, but temper it with empathy.";

export const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useUser();
  const userName = user.name || "Seeker";
  const [showCheckin, setShowCheckin] = useState(false);
  const { hasCheckedInToday, currentStreak } = useCheckin();

  // Subscription tier state (from profile or default to free)
  const subscriptionTier = useMemo(() => {
    // Check if user has subscription_tier field or default to free
    // This could also check a subscriptions table in the future
    return (user as { subscription_tier?: string }).subscription_tier || "free";
  }, [user]);

  const isPremium = subscriptionTier === "premium";

  // User's sun sign for personalized insight
  const userSign = useMemo(() => {
    if (user?.birthData?.date) {
      return getSunSign(user.birthData.date);
    }
    return null;
  }, [user?.birthData?.date]);

  // Daily insight state
  const [dailyInsight, setDailyInsight] = useState<string>(DEFAULT_INSIGHT);
  const [insightLoading, setInsightLoading] = useState(false);

  // Fetch personalized daily insight
  useEffect(() => {
    const fetchDailyInsight = async () => {
      const today = new Date().toDateString();
      const cacheKey = userSign ? `daily_insight_${userSign}` : "daily_insight_general";
      const cached = localStorage.getItem(cacheKey);
      const cachedDate = localStorage.getItem(`${cacheKey}_date`);

      // Use cached insight if available and from today
      if (cached && cachedDate === today) {
        setDailyInsight(cached);
        return;
      }

      // Skip AI call if no sign available
      if (!userSign) {
        setDailyInsight(DEFAULT_INSIGHT);
        return;
      }

      setInsightLoading(true);
      try {
        const response = await AIService.generateDailySpark({ sign: userSign });
        const insight = response.message;
        setDailyInsight(insight);
        localStorage.setItem(cacheKey, insight);
        localStorage.setItem(`${cacheKey}_date`, today);
      } catch (error) {
        console.error("[UserDashboard] Failed to fetch daily insight:", error);
        // Use cached or default
        setDailyInsight(cached || DEFAULT_INSIGHT);
      } finally {
        setInsightLoading(false);
      }
    };

    fetchDailyInsight();
  }, [userSign]);

  // Show check-in modal on first visit if not checked in
  useEffect(() => {
    const todayKey = `silksparks_checkin_prompt_${new Date().toDateString()}`;
    const hasSeenToday = localStorage.getItem(todayKey);
    if (!hasCheckedInToday && !hasSeenToday) {
      setShowCheckin(true);
      localStorage.setItem(todayKey, "true");
    }
  }, [hasCheckedInToday]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Successfully signed out");
    navigate(PATHS.HOME);
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
                {isPremium ? (
                  <span className="text-xs text-primary font-medium tracking-wide flex items-center gap-1">
                    Premium Member{" "}
                    <span className="material-symbols-outlined text-[10px]">
                      verified
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-text-muted font-medium tracking-wide">
                    Free Member
                  </span>
                )}
              </div>
            </div>
            {isPremium ? (
              <button
                onClick={() => navigate(PATHS.HOROSCOPE)}
                className="flex items-center gap-2 rounded-lg bg-surface-border/30 hover:bg-surface-border/50 px-3 py-2 transition-colors group w-full border border-surface-border"
              >
                <span className="material-symbols-outlined text-[18px] text-primary group-hover:rotate-45 transition-transform">
                  star
                </span>
                <span className="text-xs font-medium text-foreground">
                  View Full Chart
                </span>
              </button>
            ) : (
              <button
                onClick={() => toast("Premium membership coming soon!", { icon: "✨" })}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary/20 to-amber-500/20 hover:from-primary/30 hover:to-amber-500/30 px-3 py-2 transition-colors group w-full border border-primary/30"
              >
                <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">
                  workspace_premium
                </span>
                <span className="text-xs font-medium text-foreground">
                  Upgrade to Premium
                </span>
              </button>
            )}
          </GlassCard>

          <nav className="flex flex-col gap-2">
            <NavBtn
              icon="dashboard"
              label="My Space"
              active
              onClick={() => navigate(PATHS.DASHBOARD)}
            />
            <NavBtn
              icon="description"
              label="Digital Archives"
              onClick={() => navigate(PATHS.DASHBOARD_ARCHIVES)}
            />
            <NavBtn
              icon="shopping_bag"
              label="Order History"
              onClick={() => navigate(PATHS.DASHBOARD_ORDERS)}
            />
            <NavBtn
              icon="favorite"
              label="Favorites"
              onClick={() => navigate(PATHS.DASHBOARD_FAVORITES)}
            />
            <NavBtn
              icon="calendar_month"
              label="Consultations"
              onClick={() => navigate(PATHS.DASHBOARD_CONSULTATIONS)}
            />
            <NavBtn
              icon="settings"
              label="Settings"
              onClick={() => navigate(PATHS.DASHBOARD_SETTINGS)}
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
                  onClick={() => navigate(PATHS.REWARDS)}
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
                    {userSign && (
                      <span className="text-xs text-primary/60 font-normal normal-case">
                        ({userSign})
                      </span>
                    )}
                  </h3>
                </div>
                {insightLoading ? (
                  <div className="flex items-center gap-3 text-text-muted">
                    <span className="material-symbols-outlined text-lg animate-spin">
                      progress_activity
                    </span>
                    <span className="text-sm">Consulting the stars...</span>
                  </div>
                ) : (
                  <p className="text-foreground/90 text-lg leading-relaxed italic font-light">
                    "{dailyInsight}"
                  </p>
                )}
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-surface-border pt-4">
                <span className="text-xs text-text-muted font-bold uppercase tracking-widest">
                  TODAY
                </span>
                <button
                  onClick={() => navigate(PATHS.HOROSCOPE_REPORT)}
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
            onClick={() => navigate(PATHS.DASHBOARD_ARCHIVES)}
          />
          <DashboardCard
            title="Favorites"
            icon="favorite"
            value={user.favorites?.length || 0}
            label="Saved Items"
            color="from-red-400 to-pink-600"
            onClick={() => navigate(PATHS.DASHBOARD_FAVORITES)}
          />
          <DashboardCard
            title="Check-in"
            icon="local_fire_department"
            value={currentStreak}
            label={hasCheckedInToday ? "Day Streak" : "Check in!"}
            color="from-orange-500 to-red-500"
            onClick={() => setShowCheckin(true)}
          />
        </div>
        <CheckinModal
          isOpen={showCheckin}
          onClose={() => setShowCheckin(false)}
        />
      </main>
    </div>
  );
};
