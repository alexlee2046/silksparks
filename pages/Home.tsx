import React, { useEffect, useState } from "react";
import { Screen, NavProps } from "../types";
import { GeminiService } from "../services/GeminiService";
import { BirthDataForm } from "../components/BirthDataForm";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import {
  RecommendationEngine,
  Product,
} from "../services/RecommendationEngine";
import { motion } from "framer-motion";

export const Home: React.FC<NavProps> = ({ setScreen, setProductId }) => {
  const [dailySpark, setDailySpark] = useState<string>(
    "Aligning with the cosmos...",
  );
  const [showForm, setShowForm] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const { isBirthDataComplete } = useUser();
  const { addItem } = useCart();

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
        const spark = await GeminiService.generateDailySpark("Scorpio");
        setDailySpark(spark);
        localStorage.setItem("daily_spark", spark);
        localStorage.setItem("daily_spark_date", today);
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
      {/* Daily Ticker */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="w-full bg-surface-dark/80 backdrop-blur-md border-b border-white/5 sticky top-[73px] z-40"
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg animate-pulse">
                hotel_class
              </span>
              <p className="text-white text-sm font-medium leading-tight">
                <span className="text-primary font-bold">Daily Spark:</span>{" "}
                {dailySpark}
              </p>
            </div>
            <button
              onClick={() => setScreen(Screen.BIRTH_CHART)}
              className="text-xs sm:text-sm font-bold flex items-center gap-1 text-text-muted hover:text-white transition-colors group"
            >
              View Horoscope{" "}
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
              className="text-white text-5xl md:text-8xl font-light font-display tracking-tight leading-[1]"
            >
              Ancient Wisdom <br className="hidden md:block" />
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-primary to-amber-200/50 drop-shadow-[0_0_20px_rgba(244,192,37,0.3)]">
                Artificial Intelligence
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-[600px] text-text-muted text-lg md:text-xl font-light leading-relaxed"
            >
              Enter the Spark Engine. Decode your stars instantly with our
              AI-powered astrological interpreter that bridges the gap between
              mysticism and technology.
            </motion.p>
          </div>

          <motion.div
            variants={itemVariants}
            className="w-full max-w-[520px] p-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-white/20 transition-all duration-300"
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
                  placeholder="Enter your birth details..."
                  readOnly
                  className="cursor-pointer block w-full rounded-xl border border-white/5 bg-black/20 pl-11 pr-4 py-4 text-white placeholder-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm transition-all outline-none"
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
                className="bg-primary hover:bg-primary-hover text-background-dark font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(244,192,37,0.3)] hover:shadow-[0_0_35px_rgba(244,192,37,0.5)] flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[20px]">
                  auto_awesome
                </span>
                {isBirthDataComplete ? "View My Chart" : "Reveal My Chart"}
              </motion.button>
            </div>
            <p className="mt-3 text-[10px] text-white/30 text-center flex items-center justify-center gap-1 uppercase tracking-widest">
              <span className="material-symbols-outlined text-[12px]">
                lock
              </span>
              Encrypted & Private
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 md:px-10 relative z-10">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="psychology"
            title="AI Tarot Reader"
            desc="Ask any question and receive a detailed 3-card spread interpretation powered by our mystical LLM."
            action="Start Reading"
            onClick={() => setScreen(Screen.TAROT_DAILY)}
            index={0}
          />
          <FeatureCard
            icon="group"
            title="Expert Consultation"
            desc="Connect with real astrologers for deep-dive sessions when the AI insights spark more questions."
            action="Book Expert"
            onClick={() => setScreen(Screen.EXPERTS)}
            index={1}
          />
          <FeatureCard
            icon="diamond"
            title="Curated Artifacts"
            desc="Shop our 'Silk' collection of ethically sourced crystals, tarot decks, and ritual tools."
            action="Visit Shop"
            onClick={() => setScreen(Screen.SHOP_LIST)}
            index={2}
          />
        </div>
      </section>

      {/* Product Carousel */}
      <section className="bg-surface-dark/30 backdrop-blur-md py-24 px-4 md:px-10 border-t border-white/5">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-xl">
              <span className="text-primary font-bold tracking-widest uppercase text-xs mb-3 block">
                The Silk Collection
              </span>
              <h2 className="text-white text-3xl md:text-5xl font-light font-display tracking-tight">
                Artifacts for your journey
              </h2>
            </div>
            <button
              onClick={() => setScreen(Screen.SHOP_LIST)}
              className="text-white hover:text-primary transition-colors flex items-center gap-2 text-sm font-bold group"
            >
              View all products{" "}
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
                  title={product.title}
                  price={`$${product.price.toFixed(2)}`}
                  desc={product.description || "Sacred Artifact"}
                  image={product.image_url}
                  onClick={() => {
                    if (setProductId) setProductId(product.id);
                    setScreen(Screen.PRODUCT_DETAIL);
                  }}
                  onAddToCart={(e: React.MouseEvent) =>
                    handleAddToCart(e, product)
                  }
                  index={index}
                />
              ))
            ) : (
              // Fallback / Loading State
              <div className="w-full text-center text-white/40 py-10">
                Summoning artifacts...
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
    className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm transition-colors cursor-pointer"
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
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-text-muted text-base leading-relaxed">{desc}</p>
      </div>
      <div className="mt-2 inline-flex items-center text-sm font-bold text-primary hover:text-white transition-colors">
        {action}{" "}
        <span className="material-symbols-outlined text-lg ml-2 group-hover:translate-x-1 transition-transform">
          arrow_right_alt
        </span>
      </div>
    </div>
  </motion.div>
);

const ProductCard = ({
  title,
  price,
  desc,
  image,
  onClick,
  onAddToCart,
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
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface-dark border border-white/10">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
        style={{ backgroundImage: `url("${image}")` }}
      ></div>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 delay-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement Favorite Logic
          }}
          className="h-10 w-10 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-primary transition-colors shadow-lg transform hover:scale-105"
        >
          <span className="material-symbols-outlined text-[20px]">
            favorite
          </span>
        </button>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-60"></div>

      {/* Quick Add Overlay */}
      <div className="absolute bottom-0 inset-x-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <button
          onClick={onAddToCart}
          className="w-full h-12 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-primary transition-colors"
        >
          Add to Cart - {price}
        </button>
      </div>
    </div>

    <div className="flex justify-between items-start px-1">
      <div>
        <h3 className="text-white text-xl font-medium mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-text-muted text-sm">{desc}</p>
      </div>
    </div>
  </motion.div>
);
