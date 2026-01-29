import React from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { useFavorites } from "../../hooks/useFavorites";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/GlassCard";
import { supabase } from "../../services/supabase";
import toast from "react-hot-toast";
import { ProductCard } from "../Home";
import { useCart } from "../../context/CartContext";
import type { Tables } from "../../types/database";

export const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();
  const { addItem } = useCart();
  const [products, setProducts] = React.useState<Tables<"products">[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFavorites = async () => {
      if (!favorites || favorites.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const ids = favorites.map((f) => f.product_id);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", ids);

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [favorites]);

  return (
    <div className="flex-1 p-4 md:p-10 bg-background min-h-screen relative">
      <button
        onClick={() => navigate(PATHS.DASHBOARD)}
        className="text-text-muted hover:text-foreground mb-8 flex items-center gap-2 transition-colors group text-sm font-medium"
      >
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>{" "}
        Back to Dashboard
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 mb-10"
      >
        <h1 className="text-3xl md:text-4xl font-light font-display text-foreground">
          My <span className="font-bold text-primary">Favorites</span>
        </h1>
        <p className="text-text-muted font-light">Saved artifacts and tools.</p>
      </motion.div>

      {products.length === 0 && !loading ? (
        <GlassCard className="text-center py-20 border-dashed border-surface-border bg-transparent flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-surface-border/30 flex items-center justify-center text-text-muted mb-4">
            <span className="material-symbols-outlined text-3xl">favorite</span>
          </div>
          <p className="text-text-muted">No favorites yet.</p>
          <button
            onClick={() => navigate(PATHS.SHOP)}
            className="text-primary mt-4 hover:text-foreground font-bold text-sm tracking-wide border-b border-primary/30 pb-0.5 hover:border-foreground transition-all"
          >
            Browse Shop
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              {...product}
              index={index}
              isFavorited={true}
              onToggleFavorite={() => toggleFavorite(product.id)}
              onClick={() => navigate(PATHS.PRODUCT(product.id))}
              onAddToCart={() => {
                addItem({
                  id: String(product.id),
                  name: product.title,
                  price: product.price,
                  description: product.description || "",
                  image: product.image_url || "",
                  tags: [product.category || "General"],
                });
                toast.success(`Added ${product.title} to cart`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
