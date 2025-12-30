import React from "react";
import { Screen, NavProps } from "../types";
import AIService from "../services/ai";
import type { TarotCard } from "../services/ai/types";
import { GlowButton } from "../components/GlowButton";
import {
  RecommendationEngine,
  Product,
} from "../services/RecommendationEngine";
import { useUser } from "../context/UserContext";
import { AstrologyEngine } from "../services/AstrologyEngine";
import { motion, AnimatePresence } from "framer-motion";
import { CosmicBackground } from "../components/CosmicBackground";
import tarotData from "../src/data/tarot_cards.json";

const getRomanNumeral = (n: number): string => {
  const roman: { [key: number]: string } = {
    0: "0",
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
    11: "XI",
    12: "XII",
    13: "XIII",
    14: "XIV",
    15: "XV",
    16: "XVI",
    17: "XVII",
    18: "XVIII",
    19: "XIX",
    20: "XX",
    21: "XXI",
  };
  return roman[n] || n.toString();
};

const getCardNumberDisplay = (card: any) => {
  if (card.arcana === "Major") {
    // Extract number from ID (id is like 'm01' or 'm12')
    const num = parseInt(card.id.replace("m", ""), 10);
    return getRomanNumeral(num);
  }
  // Minor Arcana
  if (card.name.startsWith("Ace")) return "I";
  if (card.name.startsWith("Two")) return "II";
  if (card.name.startsWith("Three")) return "III";
  if (card.name.startsWith("Four")) return "IV";
  if (card.name.startsWith("Five")) return "V";
  if (card.name.startsWith("Six")) return "VI";
  if (card.name.startsWith("Seven")) return "VII";
  if (card.name.startsWith("Eight")) return "VIII";
  if (card.name.startsWith("Nine")) return "IX";
  if (card.name.startsWith("Ten")) return "X";

  return "";
};

// Updated Filter to better match the sharp gold-on-black aesthetic
const GOLD_FOIL_FILTER =
  "grayscale(100%) contrast(200%) brightness(0.7) invert(100%) sepia(100%) saturate(400%) hue-rotate(5deg)";
const GOLD_BORDER_STYLE =
  "border-[#F4C025]/50 shadow-[0_0_15px_rgba(244,192,37,0.3)]";

export const AstrologyReport: React.FC<NavProps> = ({ setScreen }) => {
  const { user, isBirthDataComplete, addArchive } = useUser();
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [planets, setPlanets] = React.useState<any>(null);
  const [elements, setElements] = React.useState<any>(null);
  const [recommendations, setRecommendations] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function generate() {
      if (!user.birthData.date || !user.birthData.location) return;

      try {
        const p = AstrologyEngine.calculatePlanetaryPositions(
          user.birthData.date,
          user.birthData.location.lat,
          user.birthData.location.lng,
        );
        const e = AstrologyEngine.calculateFiveElements(user.birthData.date);
        setPlanets(p);
        setElements(e);

        // Check cache or generate
        const cacheKey = `silk_spark_report_${user.name}_${user.birthData.date.toISOString()}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          setAnalysis(cached);
          setLoading(false);
        } else {
          const response = await AIService.generateBirthChartAnalysis({
            name: user.name,
            birthDate: user.birthData.date || new Date(),
            planets,
            elements,
          });
          const text = response.analysis;
          setAnalysis(text);
          const recs = await RecommendationEngine.getRecommendations(text, 3);
          setRecommendations(recs);
          localStorage.setItem(cacheKey, text);

          // Save to Archives
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
        console.error(err);
        setLoading(false);
      }
    }

    if (isBirthDataComplete) {
      generate();
    } else {
      setScreen(Screen.HOME);
    }
  }, [user, isBirthDataComplete, setScreen, addArchive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center relative overflow-hidden">
        <CosmicBackground />
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full mb-6"
          ></motion.div>
          <h2 className="text-white text-2xl font-display font-light animate-pulse tracking-widest">
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
      className="flex-1 flex flex-col items-center px-4 py-8 md:py-12 md:px-10 lg:px-20 relative bg-background-dark overflow-y-auto"
    >
      {/* Background Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Back Button */}
      <button
        onClick={() => setScreen(Screen.BIRTH_CHART)}
        className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 z-20 group transition-colors"
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
            className="text-4xl md:text-6xl font-display font-bold leading-tight tracking-tight text-white"
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
            <strong className="text-white">{user.name}</strong>.
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative bg-surface-dark/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

          <div className="p-8 md:p-12 flex flex-col gap-10 pb-40">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              <div className="relative shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary via-amber-600 to-transparent p-[2px]">
                  <div className="w-full h-full rounded-full bg-surface-dark flex items-center justify-center">
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
                  <h3 className="text-3xl font-bold text-white">
                    {planets?.Sun} Sun
                  </h3>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                    Core Essence
                  </span>
                </div>
                <div className="flex gap-4 text-text-muted text-base font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white/50"></span>{" "}
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
                <h4 className="text-white text-lg font-medium flex items-center gap-2">
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
                <h4 className="text-white text-lg font-medium flex items-center gap-2">
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
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-3">
              Premium Analysis Available
            </p>
            <button className="bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/40 px-8 py-3 rounded-full text-sm font-bold transition-all backdrop-blur-md">
              Unlock 12-Month Forecast
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ElementBar = ({ icon, label, percent, color }: any) => (
  <div className="flex items-center gap-4 group">
    <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-wider w-20 group-hover:text-white transition-colors">
      <span className="material-symbols-outlined text-sm">{icon}</span> {label}
    </div>
    <div className="h-2 flex-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: percent }}
        transition={{ duration: 1, ease: "circOut" }}
        className={`${color} h-full rounded-full shadow-[0_0_10px_currentColor]`}
      ></motion.div>
    </div>
    <span className="text-xs font-mono text-white/50">{percent}</span>
  </div>
);

export const TarotDaily: React.FC<NavProps> = ({ setScreen }) => {
  const { user, addArchive } = useUser();
  const [readingState, setReadingState] = React.useState<
    "idle" | "shuffling" | "drawing" | "revealed"
  >("idle");
  const [card, setCard] = React.useState<any>(null);
  const [interpretation, setInterpretation] = React.useState<string>("");
  const [recommendations, setRecommendations] = React.useState<Product[]>([]);

  const handleDraw = async () => {
    setReadingState("shuffling");

    // Simulate shuffling/drawing
    setTimeout(async () => {
      setReadingState("drawing");

      setTimeout(async () => {
        const randomCard =
          tarotData[Math.floor(Math.random() * tarotData.length)];
        const cardWithOrientation: TarotCard = {
          ...randomCard,
          arcana: randomCard.arcana as "Major" | "Minor",
          isReversed: Math.random() > 0.5,
        };
        setCard(cardWithOrientation);

        try {
          const response = await AIService.generateTarotReading({
            cards: [cardWithOrientation],
            question: "General daily advice",
            spreadType: "single",
          });
          const interpret = response.interpretation;
          setInterpretation(interpret);
          const recs = await RecommendationEngine.getRecommendations(interpret);
          setRecommendations(recs);

          addArchive({
            id: `tarot_${Date.now()}`,
            type: "Tarot",
            date: new Date(),
            title: `Daily Draw: ${randomCard.name}`,
            summary: interpret.substring(0, 100) + "...",
            content: interpret,
            image: randomCard.image,
          });
        } catch (e) {
          console.error("AI Error", e);
          setInterpretation(
            "The stars are cloudy... but this card suggests hidden potential.",
          );
        }
        setReadingState("revealed");
      }, 1500);
    }, 1500);
  };

  const resetReading = () => {
    setReadingState("idle");
    setCard(null);
    setInterpretation("");
    setRecommendations([]);
  };

  return (
    <div className="flex-1 relative z-10 flex flex-col items-center py-8 px-4 md:px-8 bg-background-dark min-h-screen">
      <div className="w-full max-w-[1100px] flex flex-col gap-8 md:gap-12">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4 relative z-20">
          <div className="w-full flex justify-between items-center mb-4">
            <button
              onClick={() => setScreen(Screen.HOME)}
              className="text-text-muted hover:text-white flex items-center gap-2 text-sm transition-colors group"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>{" "}
              Back
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-primary/80 border border-primary/20 px-3 py-1 rounded-full bg-primary/5">
              <span className="material-symbols-outlined !text-[14px]">
                auto_awesome
              </span>
              <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase">
                Daily Guidance
              </h4>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-light text-white tracking-tight">
              Your Energy{" "}
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-primary to-amber-600">
                Revealed
              </span>
            </h1>
            <p className="text-white/60 max-w-md mx-auto text-sm font-light">
              Focus your intention. What message does the Universe have for you
              today?
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <AnimatePresence mode="wait">
            {readingState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -50 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                onClick={handleDraw}
                className="cursor-pointer group relative w-64 h-[400px] perspective-1000"
              >
                <div className="absolute inset-0 w-full h-full preserve-3d group-hover:rotate-y-12 transition-transform duration-700 ease-out">
                  {/* Floating Glow */}
                  <div className="absolute -inset-4 bg-primary/20 rounded-[30px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                  <TarotCardBack />
                </div>

                {/* External CTA to avoid cluttering the card art */}
                <div className="absolute -bottom-16 w-full text-center">
                  <p className="text-[#F4C025] font-serif tracking-[0.2em] text-xs font-bold uppercase opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse-slow">
                    Tap to Reveal
                  </p>
                </div>
              </motion.div>
            )}

            {readingState === "shuffling" && (
              <motion.div
                key="shuffling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-64 h-[400px]"
              >
                {/* 3D Fan Shuffling Effect */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0"
                    initial={{ x: 0, y: 0, rotate: 0, scale: 1 }}
                    animate={{
                      x: [0, (i - 2) * 40, 0],
                      y: [0, Math.abs(i - 2) * -10, 0],
                      rotate: [0, (i - 2) * 10, 0],
                      scale: [1, 1.05, 1],
                      zIndex: i === 2 ? 10 : 0,
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "easeInOut",
                      delay: i * 0.05,
                    }}
                  >
                    <TarotCardBack showPattern={false} />
                  </motion.div>
                ))}

                <div className="absolute -bottom-24 w-full text-center space-y-2">
                  <p className="text-[#F4C025] font-serif font-bold tracking-[0.2em] text-sm animate-pulse">
                    ACCESSING AKASHIC RECORDS...
                  </p>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest">
                    Verifying Cosmic alignment
                  </p>
                </div>
              </motion.div>
            )}

            {readingState === "drawing" && (
              <motion.div
                key="drawing"
                className="relative w-64 h-[400px] perspective-1000"
                initial={{ rotateY: 0, scale: 0.9 }}
                animate={{ rotateY: 180, scale: 1.1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0 backface-hidden">
                  <TarotCardBack />
                </div>

                {/* Front of Card (Placeholder for transition) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-[#141414] border-2 border-[#F4C025] flex items-center justify-center shadow-[0_0_100px_rgba(244,192,37,0.5)]">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#F4C025]/20 to-transparent opacity-50"></div>
                </div>
              </motion.div>
            )}

            {readingState === "revealed" && card && (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start"
              >
                <div className="lg:col-span-5 flex justify-center lg:justify-end">
                  <motion.div
                    initial={{ rotateY: 90 }}
                    animate={{ rotateY: 0 }}
                    transition={{ type: "spring", stiffness: 50 }}
                    className="relative w-[300px] md:w-[360px] aspect-[4/7] rounded-2xl group cursor-pointer perspective-1000"
                  >
                    <div
                      className={`absolute inset-0 w-full h-full rounded-2xl bg-[#141414] border-2 border-[#F4C025] transition-transform duration-500 group-hover:scale-[1.02] flex flex-col p-[6%] shadow-[0_0_50px_rgba(244,192,37,0.2)]`}
                    >
                      {/* Inner Border */}
                      <div className="absolute inset-3 border border-[#F4C025] rounded-xl opacity-80 pointer-events-none z-20"></div>

                      {/* Top Numeral */}
                      <div className="h-[10%] flex items-center justify-center pt-4">
                        <span className="text-[#F4C025] font-serif font-bold text-3xl tracking-widest z-20">
                          {getCardNumberDisplay(card)}
                        </span>
                      </div>

                      {/* Image */}
                      <div className="flex-1 relative overflow-hidden my-4 mx-2">
                        <div
                          className="absolute inset-0 transition-transform duration-1000 group-hover:scale-110 opacity-90"
                          style={{
                            backgroundImage: `url("${card.image}")`,
                            backgroundSize: "contain",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            filter: GOLD_FOIL_FILTER,
                          }}
                        ></div>
                      </div>

                      {/* Bottom Title */}
                      <div className="h-[12%] flex flex-col items-center justify-center pb-4 z-20">
                        <h3 className="text-[#F4C025] font-serif font-bold text-xl uppercase tracking-[0.1em] text-center leading-tight">
                          {card.name}
                        </h3>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="lg:col-span-7 flex flex-col gap-8 text-left">
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-white/10 pb-4">
                      <h2 className="text-4xl md:text-6xl font-display font-light text-white tracking-tight">
                        {card.name}
                      </h2>
                      <div className="flex gap-2">
                        <button className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-[#F4C025] transition-colors">
                          <span className="material-symbols-outlined text-lg">
                            share
                          </span>
                        </button>
                        <button className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-[#F4C025] transition-colors">
                          <span className="material-symbols-outlined text-lg">
                            favorite
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["Destiny", "Insight", "Action", "Clarity"].map(
                        (tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-white/60 hover:text-white transition-colors cursor-default"
                          >
                            #{tag}
                          </span>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="bg-surface-dark/50 border border-white/10 p-8 rounded-2xl relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                      <span className="material-symbols-outlined text-[150px]">
                        psychology
                      </span>
                    </div>
                    <h3 className="text-white font-bold mb-4 text-lg flex items-center gap-2">
                      <span className="text-[#F4C025]">✦</span> AI
                      Interpretation
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-lg font-light">
                      {interpretation || "Interpreting the stars..."}
                    </p>
                  </div>

                  {recommendations.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">
                            diamond
                          </span>{" "}
                          Recommended Artifacts
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {recommendations.map((product, idx) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                            className="bg-white/5 border border-white/5 p-3 rounded-xl flex gap-4 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer group"
                            onClick={() => setScreen(Screen.PRODUCT_DETAIL)}
                          >
                            <div className="w-20 h-20 rounded-lg bg-black/50 flex-shrink-0 overflow-hidden relative">
                              <img
                                src={product.image}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                alt={product.name}
                              />
                            </div>
                            <div className="flex flex-col justify-center">
                              <h4 className="text-white text-sm font-bold group-hover:text-primary transition-colors">
                                {product.name}
                              </h4>
                              <span className="text-primary/80 text-xs font-medium mt-1">
                                ${product.price}
                              </span>
                              <span className="text-white/40 text-[10px] mt-2 group-hover:text-white transition-colors flex items-center gap-1">
                                View Details{" "}
                                <span className="material-symbols-outlined text-[10px]">
                                  arrow_forward
                                </span>
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-8">
                    <button
                      onClick={resetReading}
                      className="w-full md:w-auto px-8 py-3 rounded-xl border border-white/20 text-white hover:bg-white hover:text-black transition-all font-bold tracking-wide flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">refresh</span>{" "}
                      Draw Another Card
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export const TarotSpread: React.FC<NavProps> = ({ setScreen }) => {
  const [readingState, setReadingState] = React.useState<
    "idle" | "shuffling" | "drawing" | "revealed"
  >("idle");
  const [cards, setCards] = React.useState<any[]>([]);
  const [interpretation, setInterpretation] = React.useState<string>("");
  const [recommendations, setRecommendations] = React.useState<Product[]>([]);

  const handleStartSession = () => {
    setReadingState("shuffling");
    setTimeout(() => {
      // Draw 3 random cards
      const drawn = [];
      const deck = [...tarotData];
      for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * deck.length);
        drawn.push({
          ...deck[randomIndex],
          isReversed: Math.random() > 0.5,
        });
        deck.splice(randomIndex, 1);
      }
      setCards(drawn);
      setReadingState("drawing");

      // Generate Reading
      setTimeout(async () => {
        try {
          // Use AIService for 3-card spread
          const response = await AIService.generateTarotReading({
            cards: [
              { ...drawn[0], position: "past" },
              { ...drawn[1], position: "present" },
              { ...drawn[2], position: "future" },
            ],
            question:
              "Synthesize a cohesive narrative for Past, Present, and Future.",
            spreadType: "three-card",
          });
          const text = response.interpretation;
          setInterpretation(text);

          const recs = await RecommendationEngine.getRecommendations(text, 3);
          setRecommendations(recs);
        } catch (e) {
          setInterpretation(
            "The veil is thick today... but the cards speak of transformation.",
          );
        }
        setReadingState("revealed");
      }, 2000);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative bg-background-dark bg-silk-pattern min-h-screen"
    >
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-surface-dark/50 to-transparent -z-10"></div>

      {/* Back Button */}
      <button
        onClick={() => setScreen(Screen.HOME)}
        className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 z-20 group transition-colors"
      >
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>{" "}
        Back
      </button>

      <section className="relative z-10 w-full flex flex-col items-center justify-center py-10 px-4 md:px-10">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-surface-border bg-surface-dark/50 backdrop-blur-md text-primary text-xs font-bold uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-sm">
              auto_awesome
            </span>{" "}
            Three Card Spread
          </div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-6xl font-light text-white tracking-tight mb-3 font-display"
          >
            Past, Present,{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">
              Future
            </span>
          </motion.h1>
          {readingState === "idle" && (
            <p className="text-white/60 max-w-lg mx-auto mt-4 text-lg">
              Focus on a question about your path...
            </p>
          )}
        </div>

        <div className="w-full max-w-[1100px] mx-auto min-h-[400px]">
          {readingState === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-8 mt-8"
            >
              <div
                onClick={handleStartSession}
                className="relative cursor-pointer group w-64 h-[400px] perspective-1000"
              >
                {/* Stack Effect */}
                <div className="absolute top-0 left-0 w-full h-full bg-[#141414] border border-[#F4C025]/30 rounded-2xl transform translate-x-4 translate-y-4 -z-20"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[#141414] border border-[#F4C025]/30 rounded-2xl transform translate-x-2 translate-y-2 -z-10"></div>

                {/* Main Deck */}
                <div className="relative w-full h-full transform transition-transform duration-500 group-hover:-translate-y-2">
                  <TarotCardBack />

                  {/* Pulse Overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-[#F4C025]/10 animate-pulse-slow pointer-events-none"></div>
                </div>

                <div className="absolute -bottom-16 w-full text-center">
                  <span className="inline-flex items-center gap-2 text-[#F4C025] font-serif tracking-[0.2em] text-xs font-bold uppercase border-b border-[#F4C025]/30 pb-1 group-hover:border-[#F4C025] transition-colors">
                    Tap Deck to Shuffle
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {readingState === "shuffling" && (
            <div className="flex flex-col items-center justify-center h-[500px] relative">
              {/* 3 Card Shuffling Animation */}
              <div className="relative w-64 h-[400px]">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0"
                    animate={{
                      x: [0, (i - 1) * 120, 0],
                      y: [0, -20, 0],
                      rotate: [0, (i - 1) * 10, 0],
                      scale: [1, 1.05, 1],
                      zIndex: [0, 10, 0],
                    }}
                    transition={{
                      duration: 2, // Longer shuffle for 3 cards
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.2,
                    }}
                  >
                    <TarotCardBack showPattern={i === 1} />
                  </motion.div>
                ))}
              </div>

              <div className="absolute bottom-0 text-center space-y-2">
                <p className="text-[#F4C025] font-serif font-bold tracking-[0.2em] text-sm animate-pulse">
                  ALIGNING TRINITY...
                </p>
                <p className="text-white/30 text-[10px] uppercase tracking-widest">
                  Past • Present • Future
                </p>
              </div>
            </div>
          )}

          {(readingState === "drawing" || readingState === "revealed") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative mb-16 px-4">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-1/2 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#F4C025]/20 to-transparent -translate-y-1/2 z-0"></div>

              {cards.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.3, duration: 0.6 }}
                >
                  <TarotCard
                    title={card.name}
                    position={i === 0 ? "I" : i === 1 ? "II" : "III"}
                    context={
                      i === 0
                        ? "The Past"
                        : i === 1
                          ? "The Present"
                          : "The Future"
                    }
                    subtitle={card.isReversed ? "Reversed" : "Upright"}
                    image={card.image}
                    delay={i * 0.2}
                    active={i === 1} // Highlight center
                  />
                </motion.div>
              ))}
            </div>
          )}

          {readingState === "revealed" && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="w-full max-w-[960px] mx-auto bg-surface-dark border border-surface-border rounded-xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-border/50">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">
                    psychology_alt
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">
                    Spark AI Interpretation
                  </h3>
                  <p className="text-text-muted text-xs">
                    Generated based on planetary transits & card symbology
                  </p>
                </div>
              </div>
              <div className="space-y-6 text-sm text-text-muted">
                <div className="p-4 rounded-lg bg-background-dark/50 border border-surface-border border-l-4 border-l-primary">
                  <strong className="block text-primary text-xs uppercase tracking-widest mb-2">
                    Synthesis
                  </strong>
                  <p className="text-white/90 leading-relaxed font-light text-lg">
                    {interpretation}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="mt-8 border-t border-white/5 pt-8">
                  <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">
                    Recommended for your journey
                  </h4>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {recommendations.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          // If we had a router SetProductId here
                          setScreen(Screen.PRODUCT_DETAIL);
                        }}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 transition-colors"
                      >
                        <span className="text-primary material-symbols-outlined text-sm">
                          diamond
                        </span>
                        <span className="text-white text-sm">{r.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => setScreen(Screen.SHOP_LIST)}
                  className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-background-dark font-bold transition-all shadow-[0_0_20px_rgba(244,192,37,0.2)] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">
                    shopping_bag
                  </span>{" "}
                  Browse Sacred Shop
                </button>
                <button
                  onClick={() => setReadingState("idle")}
                  className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 text-white font-bold transition-all"
                >
                  New Reading
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </motion.div>
  );
};

const TarotCard = ({
  title,
  position,
  context,
  subtitle,
  image,
  icon,
  active,
  delay = 0,
  cardData, // Pass full card data if available to get number
}: any) => {
  // Try to find the card object from title if cardData not passed directly (lazy match)
  const foundCard = tarotData.find((t) => t.name === title);
  const displayNumber = foundCard ? getCardNumberDisplay(foundCard) : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      className={`relative z-10 flex flex-col items-center gap-6 group ${active ? "md:-mt-8" : ""}`}
    >
      <div className="text-center transition-opacity">
        <span className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-1 block">
          Position {position}
        </span>
        <span
          className={`font-medium ${active ? "text-[#F4C025]" : "text-white"}`}
        >
          {context}
        </span>
      </div>

      {/* Card Container mimicking the physical card */}
      <div
        className={`relative w-full max-w-[260px] aspect-[4/7] rounded-xl bg-[#141414] transition-all duration-700 transform group-hover:-translate-y-4 group-hover:scale-105 overflow-hidden cursor-pointer flex flex-col p-[6%]
          ${
            active
              ? "shadow-[0_0_30px_rgba(244,192,37,0.2)] border border-[#F4C025]"
              : "shadow-2xl border border-white/20 hover:border-[#F4C025]"
          }`}
      >
        {/* Inner Gold Border */}
        <div className="absolute inset-2 border border-[#F4C025] rounded-lg opacity-80 pointer-events-none z-20"></div>

        {/* Top Number */}
        <div className="h-[10%] flex items-center justify-center pt-2">
          <span className="text-[#F4C025] font-serif font-bold text-xl tracking-widest z-20">
            {displayNumber}
          </span>
        </div>

        {/* Image Area */}
        <div className="flex-1 relative overflow-hidden my-2 mx-2">
          <div
            className="absolute inset-0 transition-transform duration-1000 group-hover:scale-110 opacity-90"
            style={{
              backgroundImage: `url('${image}')`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: GOLD_FOIL_FILTER,
            }}
          ></div>
        </div>

        {/* Bottom Title */}
        <div className="h-[12%] flex flex-col items-center justify-center pb-2 z-20">
          <h3 className="text-[#F4C025] font-serif font-bold text-sm uppercase tracking-[0.1em] text-center leading-tight">
            {title}
          </h3>
          {/* Add subtitle if needed, e.g. reversed */}
          {subtitle === "Reversed" && (
            <span className="text-[8px] text-[#F4C025]/60 uppercase tracking-widest mt-0.5">
              Reversed
            </span>
          )}
        </div>

        {/* Shine Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-30"></div>
      </div>
    </motion.div>
  );
};

const TarotCardBack = ({ showPattern = true }: { showPattern?: boolean }) => (
  <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-[#0d0d0d] via-[#0a0a0a] to-[#0d0d0d] border border-[#F4C025]/40 overflow-hidden shadow-2xl flex flex-col items-center justify-center">
    {/* Subtle Background Gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#F4C025]/5 via-transparent to-[#F4C025]/3"></div>

    {/* Geometric Dot Pattern */}
    <div
      className="absolute inset-0 opacity-[0.08]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 50%, #F4C025 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    ></div>

    {/* Outer Decorative Border */}
    <div className="absolute inset-2 border border-[#F4C025]/20 rounded-xl pointer-events-none"></div>

    {/* Inner Frame with dual borders */}
    <div className="absolute inset-4 border-2 border-[#F4C025]/50 rounded-lg flex items-center justify-center">
      <div className="absolute inset-1.5 border border-[#F4C025]/25 rounded-md"></div>

      {/* Corner Ornaments - More elegant L-shaped */}
      {[0, 90, 180, 270].map((rot) => (
        <div
          key={rot}
          className="absolute w-6 h-6 pointer-events-none"
          style={{
            transform: `rotate(${rot}deg)`,
            top: rot === 180 || rot === 270 ? "auto" : -1,
            left: rot === 90 || rot === 180 ? "auto" : -1,
            bottom: rot === 180 || rot === 270 ? -1 : "auto",
            right: rot === 90 || rot === 180 ? -1 : "auto",
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-[#F4C025]">
            <path
              d="M0,0 L100,0 L100,15 L15,15 L15,100 L0,100 Z"
              opacity="0.9"
            />
            <circle cx="25" cy="25" r="4" opacity="0.7" />
          </svg>
        </div>
      ))}
    </div>

    {/* Flower of Life - SVG Sacred Geometry */}
    <div className="relative z-10 w-44 h-44 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-[#F4C025]/15 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500"></div>

      {/* Flower of Life SVG - 19 circles pattern */}
      <svg
        viewBox="0 0 200 200"
        className="w-40 h-40"
        style={{ opacity: showPattern ? 0.9 : 0.35 }}
      >
        <defs>
          <radialGradient id="flowerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F4C025" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F4C025" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background glow */}
        <circle cx="100" cy="100" r="85" fill="url(#flowerGlow)" />

        {/* Flower of Life Pattern - 生命之花的标准构造 */}
        {/* 中心圆 */}
        <circle
          cx="100"
          cy="100"
          r="30"
          fill="none"
          stroke="#F4C025"
          strokeWidth="1"
          opacity="0.8"
        />

        {/* 第一圈：6个圆，圆心在中心圆边上 */}
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 100 + 30 * Math.cos(rad);
          const cy = 100 + 30 * Math.sin(rad);
          return (
            <circle
              key={angle}
              cx={cx}
              cy={cy}
              r="30"
              fill="none"
              stroke="#F4C025"
              strokeWidth="1"
              opacity="0.8"
            />
          );
        })}

        {/* 第二圈：6个圆，圆心在两个相邻圆的交点 */}
        {[30, 90, 150, 210, 270, 330].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 100 + 52 * Math.cos(rad);
          const cy = 100 + 52 * Math.sin(rad);
          return (
            <circle
              key={`outer-${angle}`}
              cx={cx}
              cy={cy}
              r="30"
              fill="none"
              stroke="#F4C025"
              strokeWidth="1"
              opacity="0.7"
            />
          );
        })}

        {/* 最外圈：6个圆 */}
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 100 + 60 * Math.cos(rad);
          const cy = 100 + 60 * Math.sin(rad);
          return (
            <circle
              key={`outer2-${angle}`}
              cx={cx}
              cy={cy}
              r="30"
              fill="none"
              stroke="#F4C025"
              strokeWidth="1"
              opacity="0.6"
            />
          );
        })}

        {/* 外围边界圆 */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="#F4C025"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="#F4C025"
          strokeWidth="0.5"
          opacity="0.3"
        />
      </svg>
    </div>

    {/* Top Decorative Element */}
    <div className="absolute top-6 flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#F4C025]/50 to-transparent"></div>
        <svg className="w-3 h-3 fill-[#F4C025]/60" viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#F4C025]/50 to-transparent"></div>
      </div>
      <span className="text-[#F4C025]/50 text-[7px] font-serif tracking-[0.4em] uppercase">
        Divine Guidance
      </span>
    </div>

    {/* Bottom Logo - Silk&Sparks */}
    <div className="absolute bottom-5 flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-px bg-gradient-to-r from-transparent to-[#F4C025]/40"></div>
        <svg className="w-2.5 h-2.5 fill-[#F4C025]/50" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="6" />
        </svg>
        <div className="w-6 h-px bg-gradient-to-r from-[#F4C025]/40 to-transparent"></div>
      </div>
      <div className="text-center">
        <span className="text-[#F4C025]/80 text-[9px] font-serif tracking-[0.2em] uppercase font-medium">
          Silk<span className="text-[#F4C025]/50">&</span>Sparks
        </span>
      </div>
    </div>

    {/* Ambient Shine Effect */}
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
  </div>
);
