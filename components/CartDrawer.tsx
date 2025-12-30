import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import { supabase } from "../services/supabase";
import { GlowButton } from "./GlowButton";

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    items,
    removeItem,
    updateQuantity,
    cartTotal,
    clearCart,
  } = useCart();
  const { session } = useUser();
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!session) {
      alert("Please sign in to complete your purchase.");
      return;
    }

    setProcessing(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: session.user.id,
          total: cartTotal,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const flattenedItems = [];
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          flattenedItems.push({
            order_id: order.id,
            product_id: item.id,
            name: item.name,
            price: item.price,
            image_url: item.image,
            type: "product",
          });
        }
      }

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(flattenedItems);

      if (itemsError) throw itemsError;

      clearCart();
      setIsCartOpen(false);
      alert(`Order placed successfully! Order ID: ${order.id}`);
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert("Failed to process order: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background-dark border-l border-white/10 shadow-2xl z-[70] p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  shopping_bag
                </span>
                Cosmic Cart
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/30 gap-4">
                  <span className="material-symbols-outlined text-4xl">
                    remove_shopping_cart
                  </span>
                  <p className="font-light tracking-wide text-sm">
                    Your vessel is empty.
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-primary text-xs font-bold uppercase tracking-widest mt-4 hover:underline"
                  >
                    Explore Artifacts
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 relative group"
                  >
                    <div className="h-20 w-20 bg-black/40 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover opacity-80"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-white/20 hover:text-rose-400 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">
                            delete
                          </span>
                        </button>
                      </div>
                      <p className="text-primary font-mono text-sm mt-1">
                        ${item.price}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[10px]">
                            remove
                          </span>
                        </button>
                        <span className="text-xs font-bold text-white w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[10px]">
                            add
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-white/10 pt-6 mt-4 space-y-4">
                <div className="flex justify-between items-center text-white/50 text-sm">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/50 text-sm">
                  <span>Shipping</span>
                  <span className="font-mono text-white">
                    Calculated at checkout
                  </span>
                </div>
                <div className="flex justify-between items-center text-white text-lg font-bold pt-2 border-t border-white/5">
                  <span>Total</span>
                  <span className="font-mono text-primary">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>

                <GlowButton
                  className="w-full justify-center"
                  icon={processing ? "hourglass_empty" : "payments"}
                  onClick={handleCheckout}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Proceed to Checkout"}
                </GlowButton>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
