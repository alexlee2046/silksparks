import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/GlassCard";
import { GlowButton } from "../../components/GlowButton";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { useCart } from "../../context/CartContext";
import type { Product as ProductType } from "../../types/database";

export const ProductDetail: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const toggleFavorite = () => setIsFavorite(!isFavorite);
  const { addItem, setIsCartOpen } = useCart();

  const { data: products, loading } = useSupabaseQuery<ProductType>({
    table: "products",
    filter: (q) => q.eq("id", Number(productId)),
    enabled: !!productId,
  });
  const product = products[0];

  const handleAddToCart = () => {
    if (product) {
      addItem({
        id: String(product.id),
        name: product.name,
        price: product.price,
        description: product.description || "",
        image: product.image_url || "",
        tags: [product.category || "General"],
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
          onClick={() => navigate(PATHS.SHOP)}
          className="text-primary hover:text-foreground transition-colors text-sm font-bold uppercase tracking-widest"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  // Use product images or fallback to the main one repeated (since DB might only have one url)
  const imageUrl = product.image_url ?? "";
  const images = [imageUrl, imageUrl, imageUrl];

  return (
    <div className="flex h-full grow flex-col bg-background min-h-screen">
      <div className="px-4 lg:px-20 xl:px-40 flex flex-1 justify-center py-10">
        <div className="flex flex-col max-w-[1200px] flex-1">
          {/* Back Button */}
          <button
            onClick={() => navigate(PATHS.SHOP)}
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
              onClick={() => navigate(PATHS.SHOP)}
              className="text-text-muted hover:text-foreground cursor-pointer transition-colors"
            >
              Shop
            </span>
            <span className="text-text-muted">/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-10 px-4 py-4">
            {/* Product Image Gallery */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden group shadow-2xl border border-surface-border"
              >
                <img
                  src={images[selectedImage]}
                  alt={product?.name || "Product image"}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-500"
                />
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
                    {product.name}
                  </h1>
                  <p className="text-primary font-bold mt-2 text-lg">
                    {product.featured ? "Featured" : "Sacred Artifact"}
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
                      <strong>{product.category || "Ether"}</strong> element,
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
