import React from "react";
import { Screen, NavProps } from "../types";
import { GeminiService } from "../services/GeminiService";
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
          const text = await GeminiService.generateBirthChartAnalysis(
            user.name,
            p,
            e,
          );
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
        setCard(randomCard);

        try {
          const interpret = await GeminiService.generateTarotInterpretation(
            randomCard.name,
            "General daily advice",
          );
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleDraw}
                className="cursor-pointer group relative w-56 h-80 perspective-1000"
              >
                <div className="absolute inset-0 bg-surface-dark border-2 border-primary/30 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(244,192,37,0.1)] group-hover:shadow-[0_0_60px_rgba(244,192,37,0.3)] transition-all transform group-hover:-translate-y-2 duration-500 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                  <div className="absolute inset-3 border border-primary/20 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-primary/50 group-hover:text-primary transition-colors">
                      touch_app
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-16 left-0 right-0 text-center">
                  <p className="text-primary font-bold tracking-[0.3em] text-xs uppercase opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    Draw Card
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
                className="relative w-56 h-80"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 bg-surface-dark border border-white/20 rounded-2xl shadow-xl"
                    animate={{
                      x: [0, 20, -20, 0],
                      y: [0, -10, 5, 0],
                      rotate: [0, 5, -5, 0],
                      zIndex: [i, 0, i],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
                <p className="absolute -bottom-16 w-full text-center text-primary font-bold tracking-widest text-xs animate-pulse">
                  SHUFFLING...
                </p>
              </motion.div>
            )}

            {readingState === "drawing" && (
              <motion.div
                key="drawing"
                className="relative w-56 h-80 bg-surface-dark border border-primary rounded-2xl shadow-[0_0_50px_rgba(244,192,37,0.5)]"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 180 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0 backface-hidden bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-white/20">
                    auto_awesome
                  </span>
                </div>
                <div className="absolute inset-0 backface-hidden bg-primary rounded-2xl rotate-y-180 flex items-center justify-center">
                  <div className="w-full h-full bg-white animate-pulse"></div>
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
                    className="relative w-[300px] md:w-[360px] aspect-[2/3] rounded-3xl group cursor-pointer perspective-1000"
                  >
                    <div
                      className="absolute inset-0 w-full h-full bg-cover bg-center rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-[1.02]"
                      style={{
                        backgroundImage: `url("${card.image}")`,
                        filter:
                          "grayscale(100%) brightness(0.6) contrast(1.2) invert(100%) sepia(100%) saturate(600%) hue-rotate(10deg)",
                      }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-3xl"></div>
                    <div className="absolute bottom-8 left-0 right-0 text-center">
                      <span className="inline-block px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold tracking-[0.2em] text-primary uppercase border border-primary/30 shadow-lg">
                        {card.arcana}
                      </span>
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
                        <button className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-lg">
                            share
                          </span>
                        </button>
                        <button className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-primary transition-colors">
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
                      <span className="text-primary">✦</span> AI Interpretation
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
          const prompt = `Spread: Past (${drawn[0].name}), Present (${drawn[1].name}), Future (${drawn[2].name}). Synthesize a cohesive narrative.`;
          // Logic to call Gemini (mocking for speed/safety if API not ready, but using Service if available)
          // For now, let's use the service but fallback if it fails or if we want to save tokens in dev
          const text = await GeminiService.generateTarotInterpretation(
            "3-Card Spread",
            prompt,
          );
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
            <div className="flex justify-center mt-10">
              <GlowButton
                onClick={handleStartSession}
                className="px-12 py-6 text-xl"
                icon="playing_cards"
              >
                Begin Reading
              </GlowButton>
            </div>
          )}

          {readingState === "shuffling" && (
            <div className="flex justify-center items-center h-64">
              <div className="text-primary tracking-[0.3em] font-bold animate-pulse text-xl">
                SHUFFLING THE COSMOS...
              </div>
            </div>
          )}

          {(readingState === "drawing" || readingState === "revealed") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative mb-16">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-1/2 left-10 right-10 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2 z-0"></div>

              {cards.map((card, i) => (
                <TarotCard
                  key={i}
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
}: any) => (
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
      <span className={`font-medium ${active ? "text-primary" : "text-white"}`}>
        {context}
      </span>
    </div>
    <div
      className={`relative w-full max-w-[260px] aspect-[2/3] rounded-xl border border-surface-border bg-surface-dark/80 backdrop-blur-sm transition-all duration-700 transform group-hover:-translate-y-4 group-hover:scale-105 overflow-hidden cursor-pointer ${active ? "shadow-[0_0_40px_rgba(244,192,37,0.2)] border-primary/50" : "shadow-lg"}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110 opacity-90"
        style={{
          backgroundImage: `url('${image}')`,
          filter:
            "grayscale(100%) brightness(0.6) contrast(1.2) invert(100%) sepia(100%) saturate(600%) hue-rotate(10deg)",
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full p-6 text-center">
        <span
          className={`inline-block p-2 rounded-full bg-surface-dark/80 text-primary mb-2 border border-surface-border/50 ${active ? "border-primary/50 shadow-lg shadow-primary/20" : ""}`}
        >
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </span>
        <h3 className="text-2xl font-display font-bold text-white mb-1">
          {title}
        </h3>
        <p className="text-xs text-text-muted uppercase tracking-wider">
          {subtitle}
        </p>
      </div>
    </div>
  </motion.div>
);
