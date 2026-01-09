import React, { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import AIService from "../../services/ai";
import { RateLimitError } from "../../services/ai/SupabaseAIProvider";
import toast from "react-hot-toast";
import { useUser } from "../../context/UserContext";
import {
  AstrologyEngine,
  PlanetaryPositions,
  FiveElementsDistribution,
} from "../../services/AstrologyEngine";
import { motion } from "framer-motion";
import { ElementBar } from "./ElementBar";

// Lazy load Three.js CosmicBackground
const CosmicBackground = lazy(() =>
  import("../../components/CosmicBackground").then((m) => ({ default: m.CosmicBackground }))
);

export const AstrologyReport: React.FC = () => {
  const navigate = useNavigate();
  const { user, isBirthDataComplete, addArchive } = useUser();
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [planets, setPlanets] = React.useState<PlanetaryPositions | null>(null);
  const [elements, setElements] = React.useState<FiveElementsDistribution | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function generate() {
      if (!user.birthData.date) return;

      try {
        // Default to (0,0) if no location provided - affects accuracy but allows report generation
        const lat = user.birthData.location?.lat ?? 0;
        const lng = user.birthData.location?.lng ?? 0;
        const p = AstrologyEngine.calculatePlanetaryPositions(
          user.birthData.date,
          lat,
          lng,
        );
        const e = AstrologyEngine.calculateFiveElements(user.birthData.date);
        setPlanets(p);
        setElements(e);

        // Check cache or generate
        const userId = user.id || user.email || user.name;
        const cacheKey = `silk_spark_report_${userId}_${user.birthData.date.toISOString()}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          setAnalysis(cached);
          setLoading(false);
        } else {
          const response = await AIService.generateBirthChartAnalysis({
            name: user.name,
            birthDate: user.birthData.date || new Date(),
            planets: p,
            elements: e,
          });
          const text = response.analysis;
          setAnalysis(text);
          localStorage.setItem(cacheKey, text);

          if (response.meta?.isFallback) {
            toast("Using backup AI response", { icon: "⚠️", duration: 4000 });
          }

          addArchive({
            id: `astro_${Date.now()}`,
            type: "Astrology",
            date: new Date(),
            title: "Birth Chart Analysis",
            summary: text.substring(0, 100) + "...",
            content: text,
            image:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuCuy6mtv7iJE3VcfRhDjshoTaD7dUQNqLN1FRvSfpDZf4kZ2S8h90DxDlmIBG7ZTSRaaL66gwwIKpSvJPx81j6QYk0trYBVRmtqIlQfvIDotCaERWFsoUXcjb1aOtCIN2kkaZ-TNzojTtqHs19J8HAbICH7sbBKRr2hANVGOpM2wbqSbDSxhawtuH41k4j2yUVlqEdXGEA8lOaDSa5G7wrDW_hfKT-ZtmZVviS_B6qcElXYkZo6w3CDAxguO77b3SihJkXmj1mxOYv1",
          });

          setLoading(false);
        }
      } catch (err) {
        console.error("[AstrologyReport] Birth chart error:", err);
        if (err instanceof RateLimitError) {
          toast.error("Daily AI limit reached. Try again tomorrow.", { duration: 5000 });
        } else {
          toast.error("Failed to generate analysis. Please try again.", { duration: 4000 });
        }
        setLoading(false);
      }
    }

    if (isBirthDataComplete) {
      generate();
    } else {
      navigate(PATHS.HOME);
    }
  }, [user, isBirthDataComplete, navigate, addArchive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <Suspense fallback={null}>
          <CosmicBackground />
        </Suspense>
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full mb-6"
          ></motion.div>
          <h2 className="text-foreground text-2xl font-display font-light animate-pulse tracking-widest">
            TRANSCENDING...
          </h2>
          <p className="text-primary/60 text-sm mt-3 uppercase tracking-[0.2em]">
            Consulting the Akashic Records
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center px-4 py-8 md:py-12 md:px-10 lg:px-20 relative bg-background overflow-y-auto"
    >
      {/* Background Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Back Button */}
      <button
        onClick={() => navigate(PATHS.HOROSCOPE)}
        className="absolute top-8 left-8 text-text-muted hover:text-foreground flex items-center gap-2 z-20 group transition-colors"
      >
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>{" "}
        Back to Chart
      </button>

      <div className="w-full max-w-[900px] flex flex-col gap-10 relative z-10 mt-12">
        <div className="flex flex-col gap-3 text-center md:text-left">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-6xl font-display font-bold leading-tight tracking-tight text-foreground"
          >
            Your Astral{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
              Alignment
            </span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-text-muted text-lg font-light leading-normal"
          >
            Cosmic blueprint decoding for{" "}
            <strong className="text-foreground">{user.name}</strong>.
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative bg-surface/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-surface-border overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

          <div className="p-8 md:p-12 flex flex-col gap-10 pb-40">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              <div className="relative shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary via-amber-600 to-transparent p-[2px]">
                  <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                    <span className="text-6xl">
                      {planets?.Sun === "Leo"
                        ? "♌"
                        : planets?.Sun === "Scorpio"
                          ? "♏"
                          : "❂"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-2">
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <h3 className="text-3xl font-bold text-foreground">
                    {planets?.Sun} Sun
                  </h3>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                    Core Essence
                  </span>
                </div>
                <div className="flex gap-4 text-text-muted text-base font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-surface-border/300"></span>{" "}
                    {planets?.Moon} Moon
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary/50"></span>{" "}
                    {planets?.Mars} Mars
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            {/* AI Report */}
            <div className="grid md:grid-cols-2 gap-10 items-start">
              <div className="flex flex-col gap-6">
                <h4 className="text-foreground text-lg font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">
                    water_drop
                  </span>{" "}
                  Elemental Composition
                </h4>
                {elements && (
                  <div className="flex flex-col gap-4">
                    <ElementBar
                      icon="local_fire_department"
                      label="Fire"
                      percent={`${elements.Fire}%`}
                      color="bg-rose-500"
                    />
                    <ElementBar
                      icon="water_drop"
                      label="Water"
                      percent={`${elements.Water}%`}
                      color="bg-blue-500"
                    />
                    <ElementBar
                      icon="air"
                      label="Metal"
                      percent={`${elements.Metal}%`}
                      color="bg-slate-400"
                    />
                    <ElementBar
                      icon="landscape"
                      label="Earth"
                      percent={`${elements.Earth}%`}
                      color="bg-amber-600"
                    />
                    <ElementBar
                      icon="forest"
                      label="Wood"
                      percent={`${elements.Wood}%`}
                      color="bg-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-foreground text-lg font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    auto_awesome
                  </span>{" "}
                  Cosmic Insight
                </h4>
                <div className="prose prose-invert max-w-none">
                  <div className="text-gray-300 text-base font-light leading-loose whitespace-pre-wrap">
                    {analysis || "The stars are silent..."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Footer */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center justify-center pb-6">
            <p className="text-text-muted text-[10px] uppercase tracking-[0.2em] mb-3">
              Premium Analysis Available
            </p>
            <button className="bg-surface-border/30 hover:bg-surface-border/30 text-foreground border border-surface-border hover:border-white/40 px-8 py-3 rounded-full text-sm font-bold transition-all backdrop-blur-md">
              Unlock 12-Month Forecast
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AstrologyReport;
