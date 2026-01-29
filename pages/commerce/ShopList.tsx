import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { ELEMENTS } from "../../lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../services/supabase";
import { useCart } from "../../context/CartContext";
import {
  RecommendationEngine,
  Product,
} from "../../services/RecommendationEngine";
import { useUser } from "../../context/UserContext";
import toast from "react-hot-toast";
import { FilterSection } from "./FilterSection";
import { ShopItem } from "./ShopItem";
import type { DBProduct } from "./types";

// Sort options configuration
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const ShopList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const { addItem, setIsCartOpen } = useCart();

  // Recommendations state
  const { user } = useUser();
  const [recs, setRecs] = useState<Product[]>([]);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((value: SortOption) => {
    setSortOrder(value);
    setShowSortMenu(false);
  }, []);

  // Get current sort label
  const currentSortLabel = SORT_OPTIONS.find((opt) => opt.value === sortOrder)?.label ?? "Newest";

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase.from("products").select("*");

      // 1. DB Level Filtering for Elements (if robust schema exists)
      // Split filters into categories
      const selectedElements = filters.filter((f) =>
        (ELEMENTS as readonly string[]).includes(f)
      );

      if (selectedElements.length > 0) {
        query = query.in("category", selectedElements);
      }

      // Apply Sort at DB level (efficient)
      if (sortOrder === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortOrder === "price_asc") {
        query = query.order("price", { ascending: true });
      } else if (sortOrder === "price_desc") {
        query = query.order("price", { ascending: false });
      } else if (sortOrder === "popular") {
        // Sort by rating and review count for popularity
        query = query.order("rating", { ascending: false }).order("review_count", { ascending: false });
      }

      const { data, error } = await query;

      if (!error && data) {
        // 2. Client Side Filtering for Complex Tags (Intent, Zodiac)
        // Map UI filter text to tag keywords
        const complexFilters = filters.filter(
          (f) => !(ELEMENTS as readonly string[]).includes(f)
        );

        let filteredData = data;

        if (complexFilters.length > 0) {
          filteredData = data.filter((product) => {
            const descLower = product.description?.toLowerCase() ?? "";
            const titleLower = product.title?.toLowerCase() ?? "";

            return complexFilters.some((filterText) => {
              const lowerFilter = filterText.toLowerCase();

              let keywords = [lowerFilter];
              if (lowerFilter.includes("love"))
                keywords = ["love", "romance", "relationship"];
              if (lowerFilter.includes("wealth"))
                keywords = ["wealth", "money", "career", "abundance"];
              if (lowerFilter.includes("healing"))
                keywords = ["healing", "health"];
              if (lowerFilter.includes("protection"))
                keywords = ["protection", "shield"];

              return keywords.some(
                (k) => titleLower.includes(k) || descLower.includes(k)
              );
            });
          });
        }

        setProducts(filteredData);
      } else {
        console.error("Error loading products:", error);
        toast.error("Failed to load products. Please try again.");
      }

      // Fetch Recommendations
      const searchTerm = user?.name ? "love" : "protection";
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

  const handleQuickAdd = (e: React.MouseEvent, product: DBProduct) => {
    e.stopPropagation();
    addItem({
      id: String(product.id),
      name: product.title,
      price: product.price,
      description: product.description || "",
      image: product.image_url || "",
      tags: [product.category || "General"],
    });
    setIsCartOpen(true);
  };

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 lg:p-10 flex flex-col gap-8 bg-background min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate(PATHS.HOME)}
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
            items={[...ELEMENTS]}
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
                    onClick={() => navigate(PATHS.PRODUCT(p.id))}
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
            <div className="flex items-center gap-3 relative" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-surface/50 border border-surface-border rounded-full text-sm text-foreground hover:bg-surface-border/30 transition-colors"
                aria-haspopup="listbox"
                aria-expanded={showSortMenu}
              >
                <span>Sort: {currentSortLabel}</span>
                <span
                  className={`material-symbols-outlined text-[18px] transition-transform ${
                    showSortMenu ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>

              {/* Sort dropdown menu */}
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 min-w-[200px] bg-surface border border-surface-border rounded-xl shadow-xl z-50 overflow-hidden"
                    role="listbox"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                          sortOrder === option.value
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-surface-border/30"
                        }`}
                        role="option"
                        aria-selected={sortOrder === option.value}
                      >
                        <span>{option.label}</span>
                        {sortOrder === option.value && (
                          <span className="material-symbols-outlined text-[16px]">
                            check
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
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
                  onClick={() => navigate(PATHS.PRODUCT(product.id))}
                  onQuickAdd={(e) => handleQuickAdd(e, product)}
                />
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
