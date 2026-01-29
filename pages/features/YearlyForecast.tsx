import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PATHS } from "../../lib/paths";
import { useUser } from "../../context/UserContext";
import { supabase } from "../../services/supabase";
import { GlassCard } from "../../components/GlassCard";
import { GlowButton } from "../../components/GlowButton";
import AIService from "../../services/ai";
import toast from "react-hot-toast";

// Note: yearly_forecasts and subscriptions tables are defined in the design doc
// but may not exist in database.types.ts yet. Using type assertions until schema is updated.

// ============ Types ============

interface MonthlyForecast {
  month: number;
  title: string;
  overview: string;
  love: string;
  career: string;
  health: string;
  luckyDays: number[];
  luckyColor: string;
}

interface YearlyForecastData {
  year: number;
  sunSign: string;
  months: MonthlyForecast[];
  yearOverview: string;
}

interface UnlockOption {
  type: "premium" | "points" | "purchase";
  label: string;
  description: string;
  action: string;
  icon: string;
  available: boolean;
}

// ============ Month Card Component ============

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ZODIAC_ICONS: Record<string, string> = {
  "Aries": "local_fire_department",
  "Taurus": "landscape",
  "Gemini": "air",
  "Cancer": "water_drop",
  "Leo": "wb_sunny",
  "Virgo": "eco",
  "Libra": "balance",
  "Scorpio": "water_drop",
  "Sagittarius": "local_fire_department",
  "Capricorn": "landscape",
  "Aquarius": "air",
  "Pisces": "water_drop",
};

interface MonthCardProps {
  forecast: MonthlyForecast;
  isSelected: boolean;
  onClick: () => void;
}

const MonthCard: React.FC<MonthCardProps> = ({ forecast, isSelected, onClick }) => {
  const monthName = MONTH_NAMES[forecast.month - 1];

  return (
    <GlassCard
      className={`p-4 cursor-pointer transition-all ${
        isSelected ? "border-primary shadow-[0_0_20px_rgba(244,192,37,0.2)]" : ""
      }`}
      intensity={isSelected ? "high" : "low"}
      interactive
      onClick={onClick}
    >
      <div className="text-center">
        <span className="text-text-muted text-xs uppercase tracking-wider">
          {monthName}
        </span>
        <h4 className="text-foreground font-bold mt-1 text-sm line-clamp-1">
          {forecast.title}
        </h4>
        <div
          className="w-4 h-4 rounded-full mx-auto mt-2"
          style={{ backgroundColor: forecast.luckyColor }}
        />
      </div>
    </GlassCard>
  );
};

// ============ Month Detail Component ============

interface MonthDetailProps {
  forecast: MonthlyForecast;
  sunSign: string;
}

const MonthDetail: React.FC<MonthDetailProps> = ({ forecast, sunSign: _sunSign }) => {
  const monthName = MONTH_NAMES[forecast.month - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border pb-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground">
            {monthName}
          </h2>
          <p className="text-primary font-medium">{forecast.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full"
            style={{ backgroundColor: forecast.luckyColor }}
          />
          <div className="text-right">
            <span className="text-text-muted text-xs uppercase tracking-wider block">
              Lucky Color
            </span>
            <span className="text-foreground text-sm font-medium">
              {forecast.luckyColor}
            </span>
          </div>
        </div>
      </div>

      {/* Overview */}
      <GlassCard className="p-6" intensity="medium">
        <h3 className="text-foreground font-bold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">auto_awesome</span>
          Monthly Overview
        </h3>
        <p className="text-gray-300 leading-relaxed">{forecast.overview}</p>
      </GlassCard>

      {/* Detailed Sections */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Love */}
        <GlassCard className="p-5" intensity="low">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-pink-400">favorite</span>
            <h4 className="text-foreground font-bold">Love & Relationships</h4>
          </div>
          <p className="text-text-muted text-sm leading-relaxed">{forecast.love}</p>
        </GlassCard>

        {/* Career */}
        <GlassCard className="p-5" intensity="low">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-blue-400">work</span>
            <h4 className="text-foreground font-bold">Career & Finance</h4>
          </div>
          <p className="text-text-muted text-sm leading-relaxed">{forecast.career}</p>
        </GlassCard>

        {/* Health */}
        <GlassCard className="p-5" intensity="low">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-emerald-400">spa</span>
            <h4 className="text-foreground font-bold">Health & Wellness</h4>
          </div>
          <p className="text-text-muted text-sm leading-relaxed">{forecast.health}</p>
        </GlassCard>
      </div>

      {/* Lucky Days */}
      <GlassCard className="p-5" intensity="low">
        <h4 className="text-foreground font-bold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">calendar_today</span>
          Lucky Days This Month
        </h4>
        <div className="flex flex-wrap gap-2">
          {forecast.luckyDays.map((day) => (
            <span
              key={day}
              className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-primary font-bold text-sm"
            >
              {day}
            </span>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

// ============ Unlock Prompt Component ============

interface UnlockPromptProps {
  sunSign: string;
  options: UnlockOption[];
  onUnlock: (type: UnlockOption["type"]) => void;
  isProcessing: boolean;
}

const UnlockPrompt: React.FC<UnlockPromptProps> = ({
  sunSign,
  options,
  onUnlock,
  isProcessing,
}) => {
  return (
    <div className="max-w-3xl mx-auto text-center">
      {/* Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-12"
      >
        <GlassCard className="p-8 md:p-12 relative overflow-hidden" intensity="high">
          {/* Lock Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          <div className="absolute inset-0 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-primary mb-4">lock</span>
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">
              Unlock Your 12-Month Forecast
            </h3>
            <p className="text-text-muted max-w-md">
              Discover what the stars have in store for you throughout the year with detailed monthly predictions.
            </p>
          </div>

          {/* Blurred Preview Content */}
          <div className="filter blur-md pointer-events-none">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="material-symbols-outlined text-5xl text-primary">
                {ZODIAC_ICONS[sunSign] || "star"}
              </span>
              <h2 className="text-4xl font-display font-bold text-foreground">{sunSign}</h2>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-surface/50 rounded-xl p-4 h-24" />
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Unlock Options */}
      <h3 className="text-xl font-bold text-foreground mb-6">Choose How to Unlock</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {options.map((option, idx) => (
          <motion.div
            key={option.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <GlassCard
              className={`p-6 h-full flex flex-col ${
                !option.available ? "opacity-50" : ""
              }`}
              intensity="medium"
              hoverEffect={option.available}
            >
              <div className="flex-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-2xl text-primary">
                    {option.icon}
                  </span>
                </div>
                <h4 className="text-foreground font-bold mb-2">{option.label}</h4>
                <p className="text-text-muted text-sm mb-4">{option.description}</p>
              </div>
              <GlowButton
                variant={option.type === "premium" ? "cosmic" : "primary"}
                onClick={() => onUnlock(option.type)}
                disabled={!option.available || isProcessing}
                className="w-full"
              >
                {isProcessing ? "Processing..." : option.action}
              </GlowButton>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============ Loading State ============

const LoadingState: React.FC = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full mb-6"
    />
    <h2 className="text-foreground text-2xl font-display font-light animate-pulse tracking-widest">
      GENERATING...
    </h2>
    <p className="text-primary/60 text-sm mt-3 uppercase tracking-[0.2em]">
      Consulting the cosmic calendar
    </p>
  </div>
);

// ============ Main YearlyForecast Page ============

export const YearlyForecast: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, isBirthDataComplete, updateUser } = useUser();
  const [forecastData, setForecastData] = useState<YearlyForecastData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [processingUnlock, setProcessingUnlock] = useState(false);

  const currentYear = new Date().getFullYear();

  // Get user's sun sign from birth date
  const getSunSign = useCallback((date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();

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
  }, []);

  const sunSign = user.birthData.date ? getSunSign(user.birthData.date) : "Unknown";

  // Check unlock status and fetch existing forecast
  useEffect(() => {
    async function checkAccess() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has premium (using subscription table or profile tier)
        // Note: subscription_tier and has_yearly_forecast columns need to be added
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from("profiles")
          .select("subscription_tier, has_yearly_forecast")
          .eq("id", session.user.id)
          .single();

        // Check for active subscription
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: subscription } = await (supabase as any)
          .from("subscriptions")
          .select("status")
          .eq("user_id", session.user.id)
          .eq("status", "active")
          .single();

        const hasPremium = subscription?.status === "active" || profile?.subscription_tier === "premium";
        const hasForecasts = profile?.has_yearly_forecast || false;

        setIsUnlocked(hasPremium || hasForecasts);

        // If unlocked, try to fetch existing forecast
        if (hasPremium || hasForecasts) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: forecast } = await (supabase as any)
            .from("yearly_forecasts")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("year", currentYear)
            .single();

          if (forecast?.forecast_data) {
            setForecastData(forecast.forecast_data as YearlyForecastData);
          }
        }
      } catch (err) {
        console.error("[YearlyForecast] Error checking access:", err);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [session, currentYear]);

  // Generate forecast using AI
  const generateForecast = useCallback(async () => {
    if (!session?.user?.id || !user.birthData.date) return;

    setGenerating(true);
    try {
      // Generate 12 months of forecasts
      const months: MonthlyForecast[] = [];

      for (let month = 1; month <= 12; month++) {
        const response = await AIService.generateDailySpark({ sign: sunSign });

        // Parse AI response into structured format
        const luckyColor = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9", "#F8B500", "#E74C3C"][month - 1] ?? "#F4C025";
        months.push({
          month,
          title: `${MONTH_NAMES[month - 1]} Energy`,
          overview: response.message || "A transformative month awaits...",
          love: "This month brings opportunities for deepening connections.",
          career: "Focus on collaboration and strategic planning.",
          health: "Prioritize rest and mindful practices.",
          luckyDays: [Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 28) + 1].sort((a, b) => a - b),
          luckyColor,
        });
      }

      const forecastData: YearlyForecastData = {
        year: currentYear,
        sunSign,
        months,
        yearOverview: `${currentYear} holds tremendous potential for growth and transformation. With your ${sunSign} energy guiding you, expect significant developments in both personal and professional spheres.`,
      };

      // Save to database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("yearly_forecasts").upsert({
        user_id: session.user.id,
        year: currentYear,
        sun_sign: sunSign,
        forecast_data: forecastData,
      });

      setForecastData(forecastData);
      toast.success("Your yearly forecast is ready!");
    } catch (err) {
      console.error("[YearlyForecast] Generation error:", err);
      toast.error("Failed to generate forecast. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [session, user.birthData.date, sunSign, currentYear]);

  // Handle unlock actions
  const handleUnlock = useCallback(async (type: UnlockOption["type"]) => {
    if (!session?.user?.id) {
      toast.error("Please sign in to continue");
      navigate(PATHS.DASHBOARD);
      return;
    }

    setProcessingUnlock(true);
    try {
      if (type === "premium") {
        navigate("/membership");
        return;
      }

      if (type === "points") {
        const POINTS_COST = 800;
        if (user.points < POINTS_COST) {
          toast.error("Not enough points");
          return;
        }

        // Deduct points
        const newPoints = user.points - POINTS_COST;
        await supabase
          .from("profiles")
          .update({ points: newPoints, has_yearly_forecast: true })
          .eq("id", session.user.id);

        updateUser({ points: newPoints });
        setIsUnlocked(true);
        toast.success("Forecast unlocked with points!");
        return;
      }

      if (type === "purchase") {
        // Create Stripe checkout for one-time purchase
        const { data, error } = await supabase.functions.invoke("create-checkout-session", {
          body: {
            mode: "payment",
            productType: "yearly_forecast",
            successUrl: `${window.location.origin}/horoscope/yearly?success=true`,
            cancelUrl: `${window.location.origin}/horoscope/yearly?canceled=true`,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        }
      }
    } catch (err) {
      console.error("[YearlyForecast] Unlock error:", err);
      toast.error("Failed to unlock. Please try again.");
    } finally {
      setProcessingUnlock(false);
    }
  }, [session, user.points, navigate, updateUser]);

  // Handle URL params for payment success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Forecast unlocked! Generating your predictions...");
      setIsUnlocked(true);
      window.history.replaceState({}, "", "/horoscope/yearly");
    } else if (params.get("canceled") === "true") {
      toast("Purchase canceled. You can try again anytime.");
      window.history.replaceState({}, "", "/horoscope/yearly");
    }
  }, []);

  // Generate forecast when unlocked but no data
  useEffect(() => {
    if (isUnlocked && !forecastData && !generating && session?.user?.id) {
      generateForecast();
    }
  }, [isUnlocked, forecastData, generating, session, generateForecast]);

  // Redirect if no birth data
  useEffect(() => {
    if (!loading && !isBirthDataComplete) {
      toast.error("Please complete your birth chart first");
      navigate(PATHS.HOROSCOPE);
    }
  }, [loading, isBirthDataComplete, navigate]);

  // Unlock options based on user state
  const unlockOptions: UnlockOption[] = [
    {
      type: "premium",
      label: "Premium Member",
      description: "Includes unlimited access to all forecasts",
      action: "Upgrade to Premium",
      icon: "workspace_premium",
      available: true,
    },
    {
      type: "points",
      label: "Redeem Points",
      description: `Use 800 Spark Points (You have ${user.points.toLocaleString()})`,
      action: user.points >= 800 ? "Redeem Now" : "Not Enough Points",
      icon: "stars",
      available: user.points >= 800,
    },
    {
      type: "purchase",
      label: "One-Time Purchase",
      description: "Buy this year's forecast for $4.99",
      action: "Purchase Now",
      icon: "shopping_cart",
      available: true,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  if (generating) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-8 lg:px-12">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate(PATHS.HOROSCOPE)}
            className="text-text-muted hover:text-foreground flex items-center gap-2 text-sm transition-colors group mb-6"
          >
            <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            Back to Birth Chart
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <span className="text-primary font-bold text-sm uppercase tracking-wider">
                {currentYear} Forecast
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
              Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">
                12-Month
              </span>{" "}
              Cosmic Journey
            </h1>

            <p className="text-text-muted mt-3 max-w-xl mx-auto">
              Detailed monthly predictions tailored to your {sunSign} energy.
            </p>
          </motion.div>
        </div>

        {/* Main Content */}
        {!isUnlocked ? (
          <UnlockPrompt
            sunSign={sunSign}
            options={unlockOptions}
            onUnlock={handleUnlock}
            isProcessing={processingUnlock}
          />
        ) : forecastData ? (
          <div className="space-y-8">
            {/* Year Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="p-6 md:p-8" intensity="high">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-4xl text-background-dark">
                      {ZODIAC_ICONS[sunSign] || "star"}
                    </span>
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                      {sunSign} - {currentYear} Year Overview
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                      {forecastData.yearOverview}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Month Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-bold text-foreground mb-4">Select Month</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3">
                {forecastData.months.map((month) => (
                  <MonthCard
                    key={month.month}
                    forecast={month}
                    isSelected={selectedMonth === month.month}
                    onClick={() => setSelectedMonth(month.month)}
                  />
                ))}
              </div>
            </motion.div>

            {/* Selected Month Detail */}
            <AnimatePresence mode="wait">
              {forecastData.months.find((m) => m.month === selectedMonth) && (
                <MonthDetail
                  key={selectedMonth}
                  forecast={forecastData.months.find((m) => m.month === selectedMonth)!}
                  sunSign={sunSign}
                />
              )}
            </AnimatePresence>

            {/* Regenerate Option */}
            <div className="text-center pt-8">
              <button
                onClick={generateForecast}
                disabled={generating}
                className="text-text-muted hover:text-foreground text-sm transition-colors inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Regenerate Forecast
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-text-muted/30 mb-4">
              hourglass_empty
            </span>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Generating Your Forecast
            </h3>
            <p className="text-text-muted">
              Please wait while we consult the stars...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YearlyForecast;
