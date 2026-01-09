import React from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { useUser } from "../../context/UserContext";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/GlassCard";
import { ArchiveCard } from "./ArchiveCard";

export const Archives: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const archives = user.archives || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  return (
    <div className="flex-1 p-4 md:p-10 bg-background min-h-screen relative">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

      <button
        onClick={() => navigate(PATHS.DASHBOARD)}
        className="relative z-10 text-text-muted hover:text-foreground mb-8 flex items-center gap-2 transition-colors group text-sm font-medium"
      >
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>{" "}
        Back to Dashboard
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col gap-3 mb-10 text-center md:text-left"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-border/30 border border-surface-border text-xs font-bold uppercase tracking-widest text-primary w-fit mx-auto md:mx-0">
          <span className="material-symbols-outlined text-[14px]">
            history_edu
          </span>{" "}
          Journal
        </div>
        <h1 className="text-4xl md:text-5xl font-light font-display text-foreground">
          Digital{" "}
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
            Archives
          </span>
        </h1>
        <p className="text-text-muted text-lg font-light">
          Revisit your cosmic journey and personalized insights.
        </p>
      </motion.div>

      {archives.length === 0 ? (
        <GlassCard className="text-center py-24 flex flex-col items-center justify-center gap-4 border-dashed border-surface-border bg-transparent">
          <div className="h-20 w-20 rounded-full bg-surface-border/30 flex items-center justify-center text-text-muted mb-2">
            <span className="material-symbols-outlined text-4xl">
              auto_stories
            </span>
          </div>
          <h3 className="text-foreground font-bold text-lg">
            Your spiritual journal is empty
          </h3>
          <p className="text-text-muted max-w-sm">
            Readings and reports you save will appear here for your reflection.
          </p>
        </GlassCard>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10"
        >
          {archives.map((item, idx) => (
            <ArchiveCard key={item.id || idx} item={item} />
          ))}
        </motion.div>
      )}
    </div>
  );
};
