import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../lib/paths";
import AIService from "../services/ai";
import { RateLimitError } from "../services/ai/SupabaseAIProvider";
import { BirthDataForm } from "../components/BirthDataForm";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { useFavorites } from "../hooks/useFavorites";
import {
  RecommendationEngine,
  Product,
} from "../services/RecommendationEngine";
import { motion, AnimatePresence } from "framer-motion";
import { variants } from "../lib/animations";
import { SEO } from "../components/SEO";
import { JsonLd } from "../components/JsonLd";
import toast from "react-hot-toast";
import * as m from "../src/paraglide/messages";
import { CheckinModal } from "../components/CheckinModal";
import { useCheckin } from "../hooks/useCheckin";
import { useJourneyState } from "../hooks/useJourneyState";

/**
 * 根据出生日期计算太阳星座
 */
function getSunSign(birthDate: Date): string {
  const month = birthDate.getMonth() + 1; // 0-indexed
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
  return "Pisces"; // Feb 19 - Mar 20
}

/**
 * 获取当天的星座（基于太阳当前位置）
 */
function getTodaySign(): string {
  return getSunSign(new Date());
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [dailySpark, setDailySpark] = useState<string>(
    m["home.dailySpark.loading"](),
  );
  const [showForm, setShowForm] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const { isBirthDataComplete, user, session } = useUser();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { locale } = useLanguage(); // Subscribe to locale changes
  void locale; // Ensure re-render on language change
  const [showCheckin, setShowCheckin] = useState(false);
  const { hasCheckedInToday } = useCheckin();
  const { isFirstVisit, completedFeatures, suggestedNext, markVisited } = useJourneyState();

  // 计算用户星座（基于出生日期，如果没有则使用当天星座）
  const userBirthDate = user?.birthData?.date;
  const userSign = useMemo(() => {
    if (userBirthDate) {
      return getSunSign(userBirthDate);
    }
    return getTodaySign();
  }, [userBirthDate]);

  // Dynamic feature card ordering based on journey state
  const featureCards = useMemo(() => {
    const cards = [
      {
        key: "fusion" as const,
        icon: "yin_yang",
        title: m["home.features.fusion.title"](),
        desc: m["home.features.fusion.description"](),
        action: m["home.features.fusion.action"](),
        onClick: () => isBirthDataComplete ? navigate(PATHS.FUSION) : setShowForm(true),
        badge: m["home.features.fusion.badge"](),
      },
      {
        key: "tarot" as const,
        icon: "psychology",
        title: m["home.features.tarot.title"](),
        desc: m["home.features.tarot.description"](),
        action: m["home.features.tarot.action"](),
        onClick: () => navigate(PATHS.TAROT),
      },
      {
        key: "experts" as const,
        icon: "group",
        title: m["home.features.experts.title"](),
        desc: m["home.features.experts.description"](),
        action: m["home.features.experts.action"](),
        onClick: () => navigate(PATHS.EXPERTS),
      },
    ];

    // Reorder: put the suggested feature first
    if (isFirstVisit || suggestedNext === "tarot") {
      // First visit or tarot suggested: Tarot first
      const tarot = cards.find(c => c.key === "tarot")!;
      const rest = cards.filter(c => c.key !== "tarot");
      return [tarot, ...rest];
    }
    if (suggestedNext === "fusion" || suggestedNext === "astrology") {
      // Fusion/Astrology suggested: Fusion first (default order)
      return cards;
    }
    return cards;
  }, [isFirstVisit, suggestedNext, isBirthDataComplete, navigate, setShowForm]);

  // Fetch featured products
  useEffect(() => {
    const fetchProducts = async () => {
      const products = await RecommendationEngine.getFeaturedProducts(4);
      setFeaturedProducts(products);
    };
    fetchProducts();
  }, []);

  // Show check-in reminder for logged-in users who haven't checked in
  useEffect(() => {
    if (session && !hasCheckedInToday) {
      const todayKey = `silksparks_home_checkin_${new Date().toDateString()}`;
      const hasSeenToday = localStorage.getItem(todayKey);
      if (!hasSeenToday) {
        const timer = setTimeout(() => {
          setShowCheckin(true);
          localStorage.setItem(todayKey, "true");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [session, hasCheckedInToday]);

  useEffect(() => {
    const fetchSpark = async () => {
      const today = new Date().toDateString();
      // 缓存键包含星座，这样不同星座有不同的缓存
      const cacheKey = `daily_spark_${userSign}`;
      const cached = localStorage.getItem(cacheKey);
      const cachedDate = localStorage.getItem(`${cacheKey}_date`);

      if (cached && cachedDate === today) {
        setDailySpark(cached);
      } else {
        try {
          const response = await AIService.generateDailySpark({
            sign: userSign,
          });
          const spark = response.message;
          setDailySpark(spark);
          localStorage.setItem(cacheKey, spark);
          localStorage.setItem(`${cacheKey}_date`, today);

          // 显示 fallback 状态提示
          if (response.meta?.isFallback) {
            toast("Daily spark using backup source", {
              icon: "⚠️",
              duration: 3000,
            });
          }
        } catch (error) {
          if (error instanceof RateLimitError) {
            toast.error("Daily limit reached", { duration: 3000 });
          }
          // 使用本地缓存或默认消息
          setDailySpark(cached || "Trust your inner light today ✨");
          console.error("[Home] Daily spark error:", error);
        }
      }
    };
    fetchSpark();
  }, [userSign]);

  return (
    <div className="min-h-screen">
      <SEO
        title="Home"
        description="Enter the Spark Engine. Decode your stars instantly with our AI-powered astrological interpreter."
        keywords={["astrology", "AI", "tarot", "horoscope", "Silk & Spark"]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Silk & Spark",
          url: "https://silksparks.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://silksparks.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      {/* Daily Ticker */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="w-full bg-surface/80 backdrop-blur-md border-b border-surface-border sticky top-[73px] z-40"
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg animate-pulse">
                hotel_class
              </span>
              <p className="text-foreground text-sm font-medium leading-tight">
                <span className="text-primary font-bold">{m["home.dailySpark.label"]()}:</span>{" "}
                {dailySpark}
              </p>
            </div>
            <button
              onClick={() => navigate(PATHS.HOROSCOPE)}
              className="text-xs sm:text-sm font-bold flex items-center gap-1 text-text-muted hover:text-foreground transition-colors group"
            >
              {m["home.dailySpark.viewHoroscope"]()}{" "}
              <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      {showForm && (
        <BirthDataForm
          onCancel={() => setShowForm(false)}
          onComplete={() => {
            setShowForm(false);
            navigate(PATHS.HOROSCOPE);
          }}
        />
      )}

      {/* Hero - East-West Fusion */}
      <section className="relative flex min-h-[80vh] w-full flex-col items-center justify-center py-20 px-4 isolate">
        {/* Glow effects - dual colors for East/West */}
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute top-1/2 right-1/3 translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[100px] -z-10"></div>

        <motion.div
          variants={variants.stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex max-w-[960px] flex-col items-center gap-10 text-center"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Fusion Badge */}
            <motion.div
              variants={variants.staggerItem}
              className="inline-flex items-center gap-3 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 px-5 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(244,192,37,0.15)]"
            >
              <span className="text-lg">☯</span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {m["home.hero.badge"]()}
              </span>
            </motion.div>

            {/* Main Title - Two Lines */}
            <motion.h1
              data-testid="main-title"
              variants={variants.staggerItem}
              className="text-foreground text-4xl md:text-7xl font-light font-display tracking-tight leading-[1.1]"
            >
              <span className="block">{m["home.hero.title1"]()}</span>
              <span className="block font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-primary to-purple-400 drop-shadow-[0_0_25px_rgba(244,192,37,0.4)]">
                {m["home.hero.title2"]()}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={variants.staggerItem}
              className="max-w-[600px] text-text-muted text-lg md:text-xl font-light leading-relaxed"
            >
              {m["home.hero.subtitle"]()}
            </motion.p>

            {/* Fusion Insight Carousel */}
            {!isFirstVisit && <FusionInsightCarousel />}
          </div>

          {/* CTA Box */}
          <motion.div
            variants={variants.staggerItem}
            className="w-full max-w-[520px] flex flex-col items-center gap-4"
          >
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Primary CTA */}
              {suggestedNext === "tarot" || (!completedFeatures.includes("tarot")) ? (
                <motion.button
                  data-testid="hero-cta-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    markVisited();
                    navigate(PATHS.TAROT);
                  }}
                  className={`flex-1 bg-gradient-to-r from-primary to-amber-500 hover:from-primary-hover hover:to-amber-400 text-background font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(244,192,37,0.3)] hover:shadow-[0_0_35px_rgba(244,192,37,0.5)] flex items-center justify-center gap-2${isFirstVisit ? " cta-breathing" : ""}`}
                >
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                  {m["home.hero.cta.tarot"]?.() ?? "Draw Today's Tarot"}
                </motion.button>
              ) : suggestedNext === "astrology" || !isBirthDataComplete ? (
                <motion.button
                  data-testid="hero-cta-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    markVisited();
                    setShowForm(true);
                  }}
                  className={`flex-1 bg-gradient-to-r from-primary to-amber-500 hover:from-primary-hover hover:to-amber-400 text-background font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(244,192,37,0.3)] hover:shadow-[0_0_35px_rgba(244,192,37,0.5)] flex items-center justify-center gap-2${isFirstVisit ? " cta-breathing" : ""}`}
                >
                  <span className="material-symbols-outlined text-[20px]">astronomy</span>
                  {m["home.hero.cta.starchart"]?.() ?? "Unlock Your Star Chart"}
                </motion.button>
              ) : (
                <motion.button
                  data-testid="hero-cta-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    markVisited();
                    navigate(PATHS.FUSION);
                  }}
                  className={`flex-1 bg-gradient-to-r from-primary to-amber-500 hover:from-primary-hover hover:to-amber-400 text-background font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(244,192,37,0.3)] hover:shadow-[0_0_35px_rgba(244,192,37,0.5)] flex items-center justify-center gap-2${isFirstVisit ? " cta-breathing" : ""}`}
                >
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                  {m["home.hero.cta.fusion"]?.() ?? "Today's Fusion Reading"}
                </motion.button>
              )}

              {/* Secondary CTA */}
              <motion.button
                data-testid="hero-cta-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (suggestedNext === "tarot" || !completedFeatures.includes("tarot")) {
                    setShowForm(true);
                  } else {
                    navigate(PATHS.TAROT);
                  }
                }}
                className="sm:w-auto px-6 py-4 rounded-xl border border-surface-border bg-surface/60 backdrop-blur-md text-foreground hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {suggestedNext === "tarot" || !completedFeatures.includes("tarot") ? "calendar_month" : "psychology"}
                </span>
                {suggestedNext === "tarot" || !completedFeatures.includes("tarot")
                  ? (m["home.hero.cta.birthdata"]?.() ?? "Enter birth info")
                  : (m["home.hero.cta.dailytarot"]?.() ?? "Daily Tarot")}
              </motion.button>
            </div>

            {isFirstVisit && (
              <p className="text-[10px] text-text-muted text-center flex items-center justify-center gap-1 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[12px]">lock</span>
                {m["home.hero.noSignup"]?.() ?? "No signup needed"}
              </p>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Features - Dynamic Order */}
      <section className="py-24 px-4 md:px-10 relative z-10">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {featureCards.map((card, index) => (
            <div key={card.key} className="relative">
              {completedFeatures.includes(card.key) && (
                <div className="absolute top-3 left-3 z-10 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-400 text-xs">check</span>
                </div>
              )}
              <FeatureCard
                icon={card.icon}
                title={card.title}
                desc={card.desc}
                action={card.action}
                onClick={card.onClick}
                index={index}
                featured={index === 0}
                badge={index === 0 ? card.badge : undefined}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Product Carousel */}
      <section className="bg-surface/30 backdrop-blur-md py-24 px-4 md:px-10 border-t border-surface-border">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-xl">
              <span className="text-primary font-bold tracking-widest uppercase text-xs mb-3 block">
                {m["home.products.sectionLabel"]()}
              </span>
              <h2 className="text-foreground text-3xl md:text-5xl font-light font-display tracking-tight">
                {m["home.products.sectionTitle"]()}
              </h2>
            </div>
            <button
              onClick={() => navigate(PATHS.SHOP)}
              className="text-foreground hover:text-primary transition-colors flex items-center gap-2 text-sm font-bold group"
            >
              {m["home.products.viewAll"]()}{" "}
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>

          <div className="flex overflow-x-auto gap-8 pb-12 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mask-image-gradient">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  index={index}
                  isFavorited={isFavorite(Number(product.id))}
                  onToggleFavorite={() => toggleFavorite(Number(product.id))}
                  onClick={() => navigate(PATHS.PRODUCT(product.id))}
                  onAddToCart={() => {
                    addItem(product);
                    toast.success(`Added ${product.name} to cart`);
                  }}
                />
              ))
            ) : (
              // Fallback / Loading State
              <div className="w-full text-center text-text-muted py-10">
                {m["home.products.loading"]()}
              </div>
            )}
          </div>
        </div>
      </section>

      <CheckinModal
        isOpen={showCheckin}
        onClose={() => setShowCheckin(false)}
      />
    </div>
  );
};

/**
 * Fusion Insight Carousel - rotates through example fusion insights
 */
const FusionInsightCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const insights = [
    m["home.fusionInsights.example1"](),
    m["home.fusionInsights.example2"](),
    m["home.fusionInsights.example3"](),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [insights.length]);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.5 } },
      }}
      className="w-full max-w-[600px] mt-4"
    >
      <div className="relative p-5 rounded-xl bg-surface/60 border border-surface-border backdrop-blur-md">
        <div className="absolute -top-2 left-4 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-[10px] font-bold uppercase tracking-wider text-purple-300">
          Sample Insight
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-foreground/90 text-sm md:text-base italic leading-relaxed"
          >
            "{insights[currentIndex]}"
          </motion.p>
        </AnimatePresence>
        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-4">
          {insights.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentIndex
                  ? "bg-primary w-4"
                  : "bg-text-muted/30 hover:bg-text-muted/50"
              }`}
              aria-label={`View insight ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
  action: string;
  onClick: () => void;
  index: number;
  featured?: boolean;
  badge?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, action, onClick, index, featured, badge }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    whileHover={{ y: -5, borderColor: featured ? "rgba(168, 85, 247, 0.5)" : "rgba(244, 192, 37, 0.4)" }}
    className={`group relative overflow-hidden rounded-2xl p-8 backdrop-blur-sm transition-colors cursor-pointer ${
      featured
        ? "bg-gradient-to-br from-primary/10 via-purple-500/5 to-surface-border/30 border-2 border-primary/30"
        : "bg-surface-border/30 border border-surface-border"
    }`}
    onClick={onClick}
  >
    {/* Featured Badge */}
    {badge && (
      <div className="absolute top-4 right-4 px-2 py-1 bg-primary/90 text-background text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
        ★ {badge}
      </div>
    )}
    <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700`}>
      <span className={`material-symbols-outlined text-[80px] ${featured ? "text-purple-400" : "text-primary"}`}>
        {icon}
      </span>
    </div>
    <div className="flex flex-col gap-6 relative z-10">
      <div className={`h-14 w-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
        featured
          ? "bg-gradient-to-br from-primary/30 via-purple-500/20 to-primary/10 border border-purple-500/30 text-purple-300"
          : "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary"
      }`}>
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <div>
        <h2 className={`text-2xl font-bold mb-3 ${featured ? "text-foreground" : "text-foreground"}`}>{title}</h2>
        <p className="text-text-muted text-base leading-relaxed">{desc}</p>
      </div>
      <div className={`mt-2 inline-flex items-center text-sm font-bold transition-colors ${
        featured ? "text-purple-300 hover:text-foreground" : "text-primary hover:text-foreground"
      }`}>
        {action}{" "}
        <span className="material-symbols-outlined text-lg ml-2 group-hover:translate-x-1 transition-transform">
          arrow_right_alt
        </span>
      </div>
    </div>
  </motion.div>
);

export const ProductCard = ({
  title,
  price,
  desc,
  image,
  onClick,
  onAddToCart,
  onToggleFavorite,
  isFavorited,
  index,
}: any) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    className="min-w-[280px] md:min-w-[340px] snap-start flex flex-col gap-5 group cursor-pointer"
    onClick={onClick}
    whileHover={{ y: -5 }}
  >
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface border border-surface-border">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
        style={{ backgroundImage: `url("${image}")` }}
      ></div>
      {/* Favorite button - always visible on mobile, hover on desktop */}
      <div className="absolute top-4 right-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
            if (!isFavorited) {
              toast.success("Added to favorites", { icon: "❤️" });
            } else {
              toast("Removed from favorites", { icon: "💔" });
            }
          }}
          className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors shadow-lg transform active:scale-95 md:hover:scale-105 ${
            isFavorited
              ? "bg-primary text-foreground"
              : "bg-white/90 text-black md:hover:bg-primary active:bg-primary/80"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[20px] ${isFavorited ? "fill" : ""}`}
          >
            favorite
          </span>
        </button>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-60"></div>

      {/* Quick Add Overlay - visible on mobile, slide-up on desktop hover */}
      <div className="absolute bottom-0 inset-x-0 p-4 translate-y-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300">
        <button
          onClick={onAddToCart}
          className="w-full h-12 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 shadow-lg md:hover:bg-primary active:bg-primary/80 transition-colors"
        >
          Add to Cart - {price}
        </button>
      </div>
    </div>

    <div className="flex justify-between items-start px-1">
      <div>
        <h3 className="text-foreground text-xl font-medium mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-text-muted text-sm">{desc}</p>
      </div>
    </div>
  </motion.div>
);
