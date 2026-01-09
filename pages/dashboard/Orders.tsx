import React from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/GlassCard";

export const Orders: React.FC = () => {
  const navigate = useNavigate();
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
          Order <span className="font-bold text-primary">History</span>
        </h1>
        <p className="text-text-muted font-light">
          Track your physical artifacts and deliveries.
        </p>
      </motion.div>

      <GlassCard className="text-center py-20 border-dashed border-surface-border bg-transparent flex flex-col items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-surface-border/30 flex items-center justify-center text-text-muted mb-4">
          <span className="material-symbols-outlined text-3xl">
            local_shipping
          </span>
        </div>
        <p className="text-text-muted">No orders placed yet.</p>
        <button
          onClick={() => navigate(PATHS.SHOP)}
          className="text-primary mt-4 hover:text-foreground font-bold text-sm tracking-wide border-b border-primary/30 pb-0.5 hover:border-foreground transition-all"
        >
          Browse Shop
        </button>
      </GlassCard>
    </div>
  );
};
