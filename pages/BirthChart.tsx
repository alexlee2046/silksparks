import React, { useEffect, useState } from "react";
import { Screen, NavProps } from "../types";
import { useUser } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";
import { AstrologyEngine } from "../services/AstrologyEngine";
import AIService from "../services/ai";
import { RateLimitError } from "../services/ai/SupabaseAIProvider";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import * as m from "../src/paraglide/messages";

export const BirthChart: React.FC<NavProps> = ({ setScreen }) => {
  const { user, isBirthDataComplete } = useUser();
  const { locale } = useLanguage();
  void locale; // 确保语言切换时重渲染
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loadingAI, setLoadingAI] = useState(false);

  // Default to (0,0) if no location provided - affects accuracy but allows chart generation
  const planets = React.useMemo(() => {
    if (user.birthData.date) {
      const lat = user.birthData.location?.lat ?? 0;
      const lng = user.birthData.location?.lng ?? 0;
      return AstrologyEngine.calculatePlanetaryPositions(
        user.birthData.date,
        lat,
        lng,
      );
    }
    return null;
  }, [user.birthData.date, user.birthData.location]);

  const elements = React.useMemo(() => {
    if (user.birthData.date) {
      return AstrologyEngine.calculateFiveElements(user.birthData.date);
    }
    return null;
  }, [user.birthData.date]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!planets || !elements || aiAnalysis || loadingAI) return;

      setLoadingAI(true);
      try {
        const response = await AIService.generateBirthChartAnalysis({
          name: user.name || m["user.defaultName"](),
          birthDate: user.birthData.date || new Date(),
          planets,
          elements,
        });
        setAiAnalysis(response.analysis);

        // 显示 fallback 状态提示
        if (response.meta?.isFallback) {
          toast("AI temporarily unavailable, using backup response", {
            icon: "⚠️",
            duration: 4000,
          });
        }
      } catch (error) {
        if (error instanceof RateLimitError) {
          toast.error("Daily AI request limit reached. Try again tomorrow.", {
            duration: 5000,
          });
        } else {
          toast.error("Failed to generate analysis. Please try again.", {
            duration: 4000,
          });
        }
        console.error("[BirthChart] AI analysis error:", error);
      } finally {
        setLoadingAI(false);
      }
    };

    fetchAnalysis();
  }, [planets, elements, aiAnalysis, loadingAI, user.name]);

  if (!isBirthDataComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-foreground p-8">
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="material-symbols-outlined text-6xl text-text-muted mb-4"
        >
          lock
        </motion.span>
        <h2 className="text-2xl font-bold mb-2">{m["birthChart.locked.title"]()}</h2>
        <p className="text-text-muted mb-6">
          {m["birthChart.locked.description"]()}
        </p>
        <button
          onClick={() => setScreen(Screen.HOME)}
          className="bg-primary hover:bg-primary-hover transition-colors text-background-dark font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-primary/20"
        >
          {m["nav.home"]()}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 overflow-y-auto">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-8">
        <button
          onClick={() => setScreen(Screen.HOME)}
          className="text-text-muted hover:text-foreground flex items-center gap-2 text-sm transition-colors group"
        >
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>{" "}
          Back
        </button>
        <div className="flex items-center gap-2 px-3 py-1 bg-surface border border-surface-border rounded-full shadow-lg backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
          <span className="text-xs font-bold uppercase text-foreground tracking-wider">
            Live Engine
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto w-full flex flex-col gap-10"
      >
        {/* Profile Header */}
        <div className="relative overflow-hidden rounded-3xl bg-surface/40 border border-surface-border backdrop-blur-xl p-8 md:p-12 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <span className="material-symbols-outlined text-[300px]">
              auto_awesome
            </span>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-primary via-amber-500 to-orange-600 p-[3px] shadow-[0_0_30px_rgba(244,192,37,0.3)]"
            >
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center border border-black/50">
                <span className="text-4xl font-display font-bold text-foreground tracking-tighter">
                  {user.name.charAt(0)}
                </span>
              </div>
            </motion.div>

            <div className="text-center md:text-left flex-1">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-6xl font-display font-light text-foreground mb-2 tracking-tight"
              >
                {user.name}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap justify-center md:justify-start gap-6 text-text-muted text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    cake
                  </span>{" "}
                  {user.birthData.date?.toLocaleDateString()}
                </span>
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    schedule
                  </span>{" "}
                  {user.birthData.time}
                </span>
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    location_on
                  </span>{" "}
                  {user.birthData.location?.name || (
                    <span className="text-text-muted italic">Not specified</span>
                  )}
                </span>
              </motion.div>
            </div>

            {planets && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="flex gap-8 bg-black/20 p-4 rounded-2xl border border-surface-border backdrop-blur-sm"
              >
                <div className="text-center">
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1 font-bold">
                    Sun
                  </div>
                  <div className="text-2xl font-bold text-primary drop-shadow-[0_0_10px_rgba(244,192,37,0.5)]">
                    {planets.Sun}
                  </div>
                </div>
                <div className="w-px h-12 bg-surface-border/30"></div>
                <div className="text-center">
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1 font-bold">
                    Moon
                  </div>
                  <div className="text-2xl font-bold text-foreground drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {planets.Moon}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Planetary Positions */}
          <div className="bg-surface/40 border border-surface-border rounded-3xl p-8 backdrop-blur-md">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-3 mb-6">
              <span className="p-2 rounded-lg bg-primary/10 text-primary material-symbols-outlined">
                public
              </span>
              Planetary Alignment
            </h3>

            {planets ? (
              <div className="flex flex-col gap-3">
                {Object.entries(planets).map(([body, sign], index) => (
                  <motion.div
                    key={body}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-surface-border/30 rounded-xl hover:bg-surface-border/30 transition-colors group cursor-default border border-transparent hover:border-surface-border"
                  >
                    <div className="flex items-center gap-4 w-1/3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-background-dark font-bold text-xs shadow-lg ${
                          body === "Sun"
                            ? "bg-amber-400 shadow-amber-400/50"
                            : body === "Moon"
                              ? "bg-gray-200 shadow-gray-200/50"
                              : body === "Mars"
                                ? "bg-red-500 shadow-red-500/50"
                                : body === "Venus"
                                  ? "bg-pink-400 shadow-pink-400/50"
                                  : "bg-blue-400 shadow-blue-400/50"
                        }`}
                      >
                        {body.substring(0, 2)}
                      </span>
                      <span className="text-foreground font-medium">{body}</span>
                    </div>
                    <div className="flex-1 h-px bg-surface-border/30 group-hover:bg-primary/30 transition-colors mx-4"></div>
                    <div className="w-1/3 text-right">
                      <span className="text-primary font-display font-bold group-hover:text-foreground transition-colors">
                        {sign}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="animate-pulse flex flex-col gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-surface-border/30 rounded-lg w-full"
                  ></div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Five Elements */}
          <div className="bg-surface/40 border border-surface-border rounded-3xl p-8 backdrop-blur-md flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 material-symbols-outlined">
                  water_drop
                </span>
                Element Balance
              </h3>
              <span className="text-[10px] font-bold tracking-widest text-text-muted px-2 py-1 rounded border border-surface-border">
                WU XING
              </span>
            </div>

            {elements ? (
              <div className="flex-1 flex flex-col justify-center gap-8">
                {/* Visual Bars */}
                {(["Wood", "Fire", "Earth", "Metal", "Water"] as const).map(
                  (el, index) => {
                    const val = elements[el];
                    const color =
                      el === "Wood"
                        ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        : el === "Fire"
                          ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                          : el === "Earth"
                            ? "bg-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.4)]"
                            : el === "Metal"
                              ? "bg-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.4)]"
                              : "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]";

                    return (
                      <div key={el} className="flex items-center gap-4">
                        <div className="w-16 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                          {el}
                        </div>
                        <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden border border-surface-border">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            transition={{
                              duration: 1,
                              delay: 0.8 + index * 0.1,
                              ease: "easeOut",
                            }}
                            className={`h-full ${color} rounded-full`}
                          ></motion.div>
                        </div>
                        <div className="w-8 text-xs font-bold text-foreground">
                          {val}%
                        </div>
                      </div>
                    );
                  },
                )}

                {/* Analysis Box */}
                <div className="mt-4 p-5 rounded-xl bg-primary/5 border border-primary/20 backdrop-blur-sm">
                  <p className="text-sm text-primary/80 leading-relaxed font-medium">
                    <span className="mr-2">💡</span>
                    {loadingAI
                      ? "Consulting the stars..."
                      : aiAnalysis ||
                        "Your dominant element represents your core strength. A balanced chart allows for smooth energy flow, while peaks indicate specialized talents."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="animate-pulse flex flex-col gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-8 bg-surface-border/30 rounded-lg w-full"
                  ></div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="w-full p-10 rounded-3xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-primary/10 border border-surface-border text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

          <h2 className="text-3xl font-display font-bold text-foreground mb-3 relative z-10">
            Ready for the Deep Dive?
          </h2>
          <p className="text-text-muted mb-8 max-w-xl mx-auto relative z-10 text-lg font-light">
            Unlock a comprehensive 20-page astrological analysis generated by
            our Spark Engine, combining Western Transits with Eastern Elemental
            theory.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setScreen(Screen.REPORT)}
            className="bg-primary hover:bg-primary-hover text-background-dark font-bold py-4 px-12 rounded-full shadow-[0_0_30px_rgba(244,192,37,0.4)] hover:shadow-[0_0_50px_rgba(244,192,37,0.6)] transition-all relative z-10 text-lg"
          >
            Generate Full Report (AI)
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};
