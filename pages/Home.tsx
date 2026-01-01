import React, { useEffect, useState } from "react";
import { Screen, NavProps } from "../types";
import AIService from "../services/ai";
import { RateLimitError } from "../services/ai/SupabaseAIProvider";
import { BirthDataForm } from "../components/BirthDataForm";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import {
  RecommendationEngine,
  Product,
} from "../services/RecommendationEngine";
import { motion } from "framer-motion";
import { SEO } from "../components/SEO";
import { JsonLd } from "../components/JsonLd";
import toast from "react-hot-toast";
import * as m from "../src/paraglide/messages";

export const Home: React.FC<NavProps> = ({ setScreen, setProductId }) => {
  const [dailySpark, setDailySpark] = useState<string>(
    m["home.dailySpark.loading"](),
  );
  const [showForm, setShowForm] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const { isBirthDataComplete, user, toggleFavorite } = useUser();
  const { addItem, addToCart } = useCart();
  const { locale } = useLanguage(); // Subscribe to locale changes
  void locale; // Ensure re-render on language change
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch featured products
  useEffect(() => {
    const fetchProducts = async () => {
      const products = await RecommendationEngine.getFeaturedProducts(4);
      setFeaturedProducts(products);
    };
    fetchProducts();
  }, []);

  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem(product);
  };

  useEffect(() => {
    const fetchSpark = async () => {
      const cached = localStorage.getItem("daily_spark");
      const today = new Date().toDateString();
      const cachedDate = localStorage.getItem("daily_spark_date");

      if (cached && cachedDate === today) {
        setDailySpark(cached);
      } else {
        try {
          const response = await AIService.generateDailySpark({
            sign: "Scorpio",
          });
          const spark = response.message;
          setDailySpark(spark);
          localStorage.setItem("daily_spark", spark);
          localStorage.setItem("daily_spark_date", today);

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
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

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
              onClick={() => setScreen(Screen.BIRTH_CHART)}
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
            setScreen(Screen.BIRTH_CHART);
          }}
        />
      )}

      {/* Hero */}
      <section className="relative flex min-h-[70vh] w-full flex-col items-center justify-center py-20 px-4 isolate">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -z-10"></div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex max-w-[960px] flex-col items-center gap-10 text-center"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(244,192,37,0.1)]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Spark Engine v2.0 Live
              </span>
            </motion.div>

            <motion.h1
              data-testid="main-title"
              variants={itemVariants}
              className="text-foreground text-5xl md:text-8xl font-light font-display tracking-tight leading-[1]"
            >
              {m["home.hero.title1"]()} <br className="hidden md:block" />
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary via-primary-hover to-amber-600 dark:from-white dark:via-primary dark:to-amber-200/50 drop-shadow-[0_0_20px_rgba(244,192,37,0.3)]">
                {m["home.hero.title2"]()}
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-[600px] text-text-muted text-lg md:text-xl font-light leading-relaxed"
            >
              {m["home.hero.subtitle"]()}
            </motion.p>
          </div>

          <motion.div
            variants={itemVariants}
            className="w-full max-w-[520px] p-2 bg-surface/80 backdrop-blur-xl rounded-2xl border border-surface-border shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] hover:border-primary/30 transition-all duration-300"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <div
                className="relative flex-1 group"
                onClick={() => setShowForm(true)}
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">
                    calendar_month
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={m["home.hero.inputPlaceholder"]()}
                  readOnly
                  className="cursor-pointer block w-full rounded-xl border border-surface-border bg-background pl-11 pr-4 py-4 text-foreground placeholder:text-text-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm transition-all outline-none"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  isBirthDataComplete
                    ? setScreen(Screen.BIRTH_CHART)
                    : setShowForm(true)
                }
                className="bg-primary hover:bg-primary-hover text-background font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(244,192,37,0.3)] hover:shadow-[0_0_35px_rgba(244,192,37,0.5)] flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[20px]">
                  auto_awesome
                </span>
                {isBirthDataComplete ? m["home.hero.ctaExisting"]() : m["home.hero.cta"]()}
              </motion.button>
            </div>
            <p className="mt-3 text-[10px] text-text-muted text-center flex items-center justify-center gap-1 uppercase tracking-widest">
              <span className="material-symbols-outlined text-[12px]">
                lock
              </span>
              {m["home.hero.privacyNote"]()}
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 md:px-10 relative z-10">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="psychology"
            title={m["home.features.tarot.title"]()}
            desc={m["home.features.tarot.description"]()}
            action={m["home.features.tarot.action"]()}
            onClick={() => setScreen(Screen.TAROT_DAILY)}
            index={0}
          />
          <FeatureCard
            icon="group"
            title={m["home.features.experts.title"]()}
            desc={m["home.features.experts.description"]()}
            action={m["home.features.experts.action"]()}
            onClick={() => setScreen(Screen.EXPERTS)}
            index={1}
          />
          <FeatureCard
            icon="diamond"
            title={m["home.features.shop.title"]()}
            desc={m["home.features.shop.description"]()}
            action={m["home.features.shop.action"]()}
            onClick={() => setScreen(Screen.SHOP_LIST)}
            index={2}
          />
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
              onClick={() => setScreen(Screen.SHOP_LIST)}
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
                  isFavorited={user.favorites.some(
                    (f) => f.product_id === product.id,
                  )}
                  onToggleFavorite={() => toggleFavorite(product.id)}
                  onClick={() => {
                    setSelectedProduct(product);
                    setIsModalOpen(true);
                  }}
                  onAddToCart={() => {
                    addToCart({ ...product, type: "product" });
                    toast.success(`Added ${product.title} to cart`);
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
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, action, onClick, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    whileHover={{ y: -5, borderColor: "rgba(244, 192, 37, 0.4)" }}
    className="group relative overflow-hidden rounded-2xl bg-surface-border/30 border border-surface-border p-8 backdrop-blur-sm transition-colors cursor-pointer"
    onClick={onClick}
  >
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
      <span className="material-symbols-outlined text-[80px] text-primary">
        {icon}
      </span>
    </div>
    <div className="flex flex-col gap-6 relative z-10">
      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-3">{title}</h2>
        <p className="text-text-muted text-base leading-relaxed">{desc}</p>
      </div>
      <div className="mt-2 inline-flex items-center text-sm font-bold text-primary hover:text-foreground transition-colors">
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
