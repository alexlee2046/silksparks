import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import { GlowButton } from "./GlowButton";
import { PaymentService } from "../services/PaymentService";
import toast from "react-hot-toast";

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
      toast.error("Please sign in to complete your purchase.");
      return;
    }

    // Check if Stripe is configured
    if (!PaymentService.isConfigured()) {
      toast.error("Payment system is not configured. Please contact support.");
      return;
    }

    setProcessing(true);
    try {
      // 1. Inventory Check
      const inventoryCheck = await PaymentService.checkInventory(items);
      if (!inventoryCheck.available) {
        toast.error(
          `Some items are unavailable: ${inventoryCheck.failedItems.join(", ")}`
        );
        setProcessing(false);
        return;
      }

      // 2. Create Stripe Checkout Session
      const result = await PaymentService.createCheckoutSession(items);

      if (!result.success) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      // 3. Clear cart and redirect to Stripe
      clearCart();
      setIsCartOpen(false);

      // Redirect to Stripe Checkout
      if (result.url) {
        window.location.href = result.url;
      } else if (result.sessionId) {
        // Fallback: use Stripe.js redirect
        await PaymentService.redirectToCheckout(result.sessionId);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Checkout failed";
      console.error("Checkout error:", error);
      toast.error("Checkout failed: " + message);
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
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-surface-border shadow-2xl z-[70] p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8 border-b border-surface-border pb-4">
              <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  shopping_bag
                </span>
                Cosmic Cart
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
                className="h-11 w-11 flex items-center justify-center rounded-xl text-text-muted hover:text-foreground hover:bg-surface-border/30 transition-colors -mr-2"
              >
                <span className="material-symbols-outlined !text-[24px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-muted gap-4">
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
                    className="flex gap-4 p-4 bg-surface-border/30 rounded-xl border border-surface-border relative group"
                  >
                    <div className="h-20 w-20 bg-black/40 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover opacity-80"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-foreground line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                          className="text-text-muted hover:text-rose-400 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">
                            delete
                          </span>
                        </button>
                      </div>
                      <p className="text-primary font-mono text-sm mt-1">
                        ${item.price}
                      </p>

                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="h-11 w-11 rounded-full bg-surface-border/30 flex items-center justify-center text-foreground hover:bg-surface-border/50 active:bg-surface-border/70 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">
                            remove
                          </span>
                        </button>
                        <span className="text-sm font-bold text-foreground w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="h-11 w-11 rounded-full bg-surface-border/30 flex items-center justify-center text-foreground hover:bg-surface-border/50 active:bg-surface-border/70 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">
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
              <div className="border-t border-surface-border pt-6 mt-4 space-y-4">
                <div className="flex justify-between items-center text-text-muted text-sm">
                  <span>Subtotal</span>
                  <span className="font-mono text-foreground">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-text-muted text-sm">
                  <span>Shipping</span>
                  <span className="font-mono text-foreground">
                    Calculated at checkout
                  </span>
                </div>
                <div className="flex justify-between items-center text-foreground text-lg font-bold pt-2 border-t border-surface-border">
                  <span>Total</span>
                  <span className="font-mono text-primary">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>

                {/* Stripe badge */}
                <div className="flex items-center justify-center gap-2 text-text-muted text-[10px] uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  <span>Secured by Stripe</span>
                </div>

                <GlowButton
                  className="w-full justify-center"
                  icon={processing ? "hourglass_empty" : "credit_card"}
                  onClick={handleCheckout}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Checkout with Stripe"}
                </GlowButton>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
