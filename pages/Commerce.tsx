import React, { useState, useEffect } from "react";
import { Screen, NavProps } from "../types";
import { motion } from "framer-motion";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { supabase } from "../services/supabase";
import { useCart } from "../context/CartContext";
import {
  RecommendationEngine,
  Product,
} from "../services/RecommendationEngine";
import { useUser } from "../context/UserContext";

export const ShopList: React.FC<NavProps> = ({ setScreen, setProductId }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const { addItem, setIsCartOpen } = useCart();

  // Recommendations state
  const { user } = useUser();
  const [recs, setRecs] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase.from("products").select(`
        *,
        product_tags (
          tags (
            name
          )
        )
      `);

      // 1. DB Level Filtering for Elements (if robust schema exists)
      const elements = ["Fire", "Water", "Air", "Earth", "Spirit"];
      // Split filters into categories
      const selectedElements = filters.filter((f) => elements.includes(f));

      if (selectedElements.length > 0) {
        query = query.in("element", selectedElements);
      }

      // Apply Sort at DB level (efficient)
      if (sortOrder === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortOrder === "price_asc") {
        query = query.order("price", { ascending: true });
      } else if (sortOrder === "price_desc") {
        query = query.order("price", { ascending: false });
      }

      const { data, error } = await query;

      if (!error && data) {
        // 2. Client Side Filtering for Complex Tags (Intent, Zodiac)
        // Map UI filter text to tag keywords
        const complexFilters = filters.filter((f) => !elements.includes(f));

        let filteredData = data;

        if (complexFilters.length > 0) {
          filteredData = data.filter((product: any) => {
            // Flatten tags for this product
            // product.product_tags structure depends on the join, typically array of objects
            const productTags =
              product.product_tags?.map((pt: any) =>
                pt.tags?.name?.toLowerCase(),
              ) || [];

            // Check if product matches ANY of the selected complex filters
            // We'll do a loose match since UI text "Love & Relationships" might map to tag "love"
            return complexFilters.some((filterText) => {
              const lowerFilter = filterText.toLowerCase();

              // Simple mapping logic
              let keywords = [lowerFilter];
              if (lowerFilter.includes("love"))
                keywords = ["love", "romance", "relationship"];
              if (lowerFilter.includes("wealth"))
                keywords = ["wealth", "money", "career", "abundance"];
              if (lowerFilter.includes("healing"))
                keywords = ["healing", "health"];
              if (lowerFilter.includes("protection"))
                keywords = ["protection", "shield"];

              // Also support Zodiac direct match
              // If filter is "Aries", tag might be "aries"

              return keywords.some((k) =>
                productTags.some((t: string) => t.includes(k) || k.includes(t)),
              );
            });
          });
        }

        setProducts(filteredData);
      } else {
        console.error("Error loading products:", error);
      }

      // Fetch Recommendations
      // Use user's birth element or just a generic term "healing" if not set
      // In real app, we'd use user.birthData.location (lat/lng -> astrological element)
      const searchTerm = user?.name ? "love" : "protection"; // Simple personalization mock
      const recommendations = await RecommendationEngine.getRecommendations(
        searchTerm,
        3,
      );
      setRecs(recommendations);

      setLoading(false);
    };
    fetchProducts();
  }, [filters, sortOrder, user]);

  const toggleFilter = (item: string) => {
    setFilters((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const handleQuickAdd = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
      description: product.description,
      image: product.image_url,
      tags: [product.element || "General"],
    });
    setIsCartOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 lg:p-10 flex flex-col gap-8 bg-background min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => setScreen(Screen.HOME)}
        className="text-text-muted hover:text-foreground flex items-center gap-2 text-sm transition-colors group w-fit"
      >
        <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>{" "}
        Back to Home
      </button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center border border-surface-border shadow-2xl"
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{
            backgroundImage:
              'linear-gradient(rgba(10, 10, 12, 0.6) 0%, rgba(10, 10, 12, 0.8) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBluCvBC91CA2EyvRNcxjhO6YPNSwgahViIPZ0TrsJ4wkjoK7N6mxBJEhDzo4zRNgjR50zVRKgQfs89W-GfIpsC85BKtyZn_gG5EBZ9ZeIYJFMNa178NE2dCDc5b-FhQ1ckmDoxP8DvduMUkYmkFyjn_hFY0Mp_H80bhYNryfTUFGTGDqxQIJEgic51AJ9VztN7HFUj2gdEfs6TUlA-euWChtzz_ZANbQXL7JOc5JxME1JKRIEfCSYBfBxbJBqjljLw3_xs1wpPkN-P")',
          }}
        ></div>
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-border/30 backdrop-blur-md border border-surface-border text-xs font-bold uppercase tracking-widest text-primary mb-4"
          >
            <span className="material-symbols-outlined text-[14px]">
              diamond
            </span>{" "}
            Curated Collection
          </motion.div>
          <h1 className="text-foreground text-4xl md:text-6xl font-display font-light leading-tight mb-4">
            Curated Tools for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200 font-bold">
              Your Journey
            </span>
          </h1>
          <p className="text-text-muted text-lg font-light max-w-xl mx-auto">
            Discover artifacts aligned with your intent, element, and spirit.
            Hand-picked for the modern mystic.
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full lg:w-72 flex-shrink-0 space-y-8 p-6 rounded-2xl border border-surface-border bg-surface/40 backdrop-blur-xl lg:sticky lg:top-24"
        >
          <div>
            <h3 className="text-foreground text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                filter_list
              </span>{" "}
              Filters
            </h3>
            <p className="text-text-muted text-xs mt-1">
              Refine by spiritual properties
            </p>
          </div>
          <FilterSection
            title="Intent"
            icon="favorite"
            items={[
              "Love & Relationships",
              "Wealth & Career",
              "Protection",
              "Healing",
            ]}
            selectedItems={filters}
            onToggle={toggleFilter}
          />
          <div className="h-px bg-surface-border w-full"></div>
          <FilterSection
            title="Elements"
            icon="local_fire_department"
            items={["Fire", "Water", "Air", "Earth", "Spirit"]}
            selectedItems={filters}
            onToggle={toggleFilter}
          />
          <div className="h-px bg-surface-border w-full"></div>
          <FilterSection
            title="Zodiac"
            icon="star"
            items={["Aries", "Taurus", "Gemini", "Cancer"]}
            selectedItems={filters}
            onToggle={toggleFilter}
          />
        </motion.aside>

        <div className="flex-1 w-full">
          {/* Recommendations Section */}
          {recs.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  auto_awesome
                </span>
                Curated For You
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recs.map((p) => (
                  <div
                    key={p.id}
                    className="group relative bg-surface-border/30 border border-surface-border rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => {
                      if (setProductId) setProductId(p.id);
                      setScreen(Screen.PRODUCT_DETAIL);
                    }}
                  >
                    <div className="aspect-[4/3] bg-black/20 relative overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-primary border border-surface-border">
                        RECOMMENDED
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-foreground font-bold text-sm truncate">
                        {p.name}
                      </h3>
                      <p className="text-text-muted text-xs mt-1 truncate">
                        {p.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-primary font-bold text-sm">
                          ${p.price}
                        </span>
                        <button className="h-6 w-6 rounded-full bg-surface-border/30 flex items-center justify-center text-foreground hover:bg-primary hover:text-background transition-colors">
                          <span className="material-symbols-outlined text-[14px]">
                            arrow_forward
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <p className="text-text-muted text-sm">
              <span className="text-foreground font-bold">{products.length}</span>{" "}
              artifacts found
            </p>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-surface/50 border border-surface-border rounded-full text-sm text-foreground hover:bg-surface-border/30 transition-colors">
                <span>Sort: {sortOrder}</span>
                <span className="material-symbols-outlined text-[18px]">
                  expand_more
                </span>
              </button>
            </div>
          </div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center text-text-muted tracking-widest uppercase">
                Summoning mystical artifacts...
              </div>
            ) : (
              products.map((product, index) => (
                <ShopItem
                  key={product.id}
                  index={index}
                  title={product.title}
                  price={`$${product.price.toFixed(2)}`}
                  element={product.element}
                  image={product.image_url}
                  badge={product.badge}
                  onClick={() => {
                    if (setProductId) setProductId(product.id);
                    setScreen(Screen.PRODUCT_DETAIL);
                  }}
                  onQuickAdd={(e: any) => handleQuickAdd(e, product)}
                />
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const FilterSection = ({
  title,
  icon,
  items,
  selectedItems,
  onToggle,
}: any) => (
  <div className="space-y-4">
    <button className="flex items-center justify-between w-full group">
      <div className="flex items-center gap-3 text-foreground font-medium text-sm">
        <span
          className={`material-symbols-outlined text-primary text-[20px] ${items ? "fill" : ""}`}
        >
          {icon}
        </span>{" "}
        {title}
      </div>
      <span className="material-symbols-outlined text-text-muted text-[20px] group-hover:text-foreground transition-colors">
        expand_more
      </span>
    </button>
    {items && (
      <div className="pl-8 space-y-3">
        {items.map((item: string) => (
          <label
            key={item}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center">
              <input
                type="checkbox"
                className="peer appearance-none h-4 w-4 border border-surface-border rounded bg-surface-border/30 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                checked={selectedItems?.includes(item)}
                onChange={() => onToggle && onToggle(item)}
              />
              <span className="absolute inset-0 flex items-center justify-center text-black opacity-0 peer-checked:opacity-100 material-symbols-outlined text-[12px] pointer-events-none">
                check
              </span>
            </div>
            <span className="text-text-muted text-sm group-hover:text-foreground transition-colors">
              {item}
            </span>
          </label>
        ))}
      </div>
    )}
  </div>
);

const ShopItem = ({
  title,
  price,
  element,
  image,
  badge,
  onClick,
  onQuickAdd,
  index,
}: any) => (
  <div
    className="animate-fade-in-up"
    style={{ animationDelay: `${index * 0.1}s` }}
    onClick={onClick}
  >
    <GlassCard
      hoverEffect
      interactive
      className="flex flex-col gap-3 group h-full"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface border border-surface-border">
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-foreground border border-primary/30 uppercase tracking-widest shadow-lg">
              {badge}
            </span>
          </div>
        )}
        <div
          className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
          style={{ backgroundImage: `url("${image}")` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

        {/* Quick Add - visible on mobile, slide-up on desktop hover */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
          <GlowButton
            variant="primary"
            className="w-full text-xs py-2.5 min-h-[44px]"
            onClick={onQuickAdd}
          >
            Quick Add
          </GlowButton>
        </div>
      </div>
      <div className="flex flex-col gap-1 p-2">
        <div className="flex justify-between items-start">
          <h3 className="text-foreground font-bold text-base leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <span className="text-primary font-bold">{price}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="material-symbols-outlined text-[14px] text-primary">
            auto_awesome
          </span>{" "}
          <span>{element} Element</span>
        </div>
      </div>
    </GlassCard>
  </div>
);

export const ProductDetail: React.FC<NavProps> = ({ setScreen, productId }) => {
  const [product, setProduct] = React.useState<any>(null);
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const toggleFavorite = () => setIsFavorite(!isFavorite);
  const [loading, setLoading] = React.useState(true);
  const { addItem, setIsCartOpen } = useCart();

  React.useEffect(() => {
    if (!productId) {
      // Fallback or returned to list
      setLoading(false);
      return;
    }
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (!error && data) {
        setProduct(data);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      addItem({
        id: product.id,
        name: product.title,
        price: product.price,
        description: product.description,
        image: product.image_url,
        tags: [product.element || "General"],
      });
      setIsCartOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-text-muted tracking-widest uppercase text-xs"
        >
          Consulting the stars...
        </motion.div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <p className="text-text-muted">Artifact not found in this dimension.</p>
        <button
          onClick={() => setScreen(Screen.SHOP_LIST)}
          className="text-primary hover:text-foreground transition-colors text-sm font-bold uppercase tracking-widest"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  // Use product images or fallback to the main one repeated (since DB might only have one url)
  const images = [
    product.image_url,
    product.image_url, // Mocking gallery for now
    product.image_url,
  ];

  return (
    <div className="flex h-full grow flex-col bg-background min-h-screen">
      <div className="px-4 lg:px-20 xl:px-40 flex flex-1 justify-center py-10">
        <div className="flex flex-col max-w-[1200px] flex-1">
          {/* Back Button */}
          <button
            onClick={() => setScreen(Screen.SHOP_LIST)}
            className="text-text-muted hover:text-foreground flex items-center gap-2 text-sm transition-colors group w-fit mb-4"
          >
            <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>{" "}
            Back to Shop
          </button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2 px-4 py-2 text-sm mb-6"
          >
            <span
              onClick={() => setScreen(Screen.SHOP_LIST)}
              className="text-text-muted hover:text-foreground cursor-pointer transition-colors"
            >
              Shop
            </span>
            <span className="text-text-muted">/</span>
            <span className="text-foreground font-medium">{product.title}</span>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-10 px-4 py-4">
            {/* Product Image Gallery */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden group shadow-2xl border border-surface-border"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                  style={{ backgroundImage: `url("${images[selectedImage]}")` }}
                ></div>
              </motion.div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-24 h-24 flex-shrink-0 rounded-lg border-2 ${selectedImage === index ? "border-primary" : "border-transparent"} overflow-hidden cursor-pointer hover:border-primary/50 transition-colors`}
                  >
                    <img src={img} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-6 lg:w-1/2 pt-2"
            >
              <div className="flex flex-col gap-4 text-left">
                <div>
                  <h1 className="text-foreground text-4xl md:text-5xl font-display font-light leading-tight tracking-[-0.02em]">
                    {product.title}
                  </h1>
                  <p className="text-primary font-bold mt-2 text-lg">
                    {product.badge || "Sacred Artifact"}
                  </p>
                </div>

                <div className="flex items-center gap-4 border-b border-surface-border pb-6">
                  <span className="text-foreground text-3xl font-bold">
                    ${product.price.toFixed(2)}
                  </span>
                  <div className="h-8 w-px bg-surface-border"></div>
                  <div className="flex flex-col">
                    <div className="flex text-[#F4C025] text-[16px]">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className="material-symbols-outlined fill"
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <span className="text-text-muted text-xs hover:text-foreground cursor-pointer transition-colors">
                      Verified Reviews
                    </span>
                  </div>
                </div>

                <GlassCard className="p-4 flex gap-4 items-start bg-primary/5 border-primary/20">
                  <div className="p-2 rounded-full bg-primary/20 text-primary animate-pulse">
                    <span className="material-symbols-outlined">
                      auto_awesome
                    </span>
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-bold mb-1 uppercase tracking-wider">
                      Cosmic Resonance
                    </h3>
                    <p className="text-text-muted text-sm font-light leading-relaxed">
                      This item aligns with the{" "}
                      <strong>{product.element || "Ether"}</strong> element,
                      enhancing your natural energies.
                    </p>
                  </div>
                </GlassCard>

                <p className="text-text-muted text-lg font-light leading-relaxed mt-2">
                  {product.description}
                </p>
              </div>

              <div className="flex flex-col gap-6 mt-6">
                <div className="flex gap-4">
                  <GlowButton
                    variant="primary"
                    icon="shopping_bag"
                    className="flex-1 h-14 text-base"
                    onClick={handleAddToCart}
                  >
                    Add to Cart
                  </GlowButton>
                  <button
                    onClick={toggleFavorite}
                    className={`h-14 w-14 rounded-full border border-surface-border flex items-center justify-center transition-colors ${isFavorite ? "text-primary border-primary/50" : "text-text-muted hover:text-primary hover:border-primary/50"}`}
                  >
                    <span
                      className={`material-symbols-outlined ${isFavorite ? "fill" : ""}`}
                    >
                      favorite
                    </span>
                  </button>
                </div>
                <p className="text-center text-xs text-text-muted">
                  Free shipping on orders over $100 • 30-day spirit guarantee
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpCard = ({ icon, title, desc, delay }: any) => (
  <GlassCard
    className="flex flex-col gap-6 p-8 items-center text-center hover:border-primary/30"
    intensity="low"
    hoverEffect
  >
    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 flex items-center justify-center text-primary mb-2 shadow-[0_0_30px_rgba(244,192,37,0.1)]">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <div className="flex flex-col gap-3">
      <h3 className="text-foreground text-xl font-bold font-display">{title}</h3>
      <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
    </div>
  </GlassCard>
);
