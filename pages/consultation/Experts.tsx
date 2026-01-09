import React from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { motion } from "framer-motion";
import { useLocaleFormat } from "../../hooks/useLocaleFormat";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import toast from "react-hot-toast";
import type { Expert } from "../../types/database";
import { ExpertCard } from "./ExpertCard";

export const Experts: React.FC = () => {
  const navigate = useNavigate();
  const { currencySymbol } = useLocaleFormat();

  const { data: experts, loading } = useSupabaseQuery<Expert>({
    table: "experts",
    orderBy: { column: "rating", ascending: false },
    onError: () => toast.error("Failed to load experts. Please try again."),
  });

  return (
    <div className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-10 bg-background min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate(PATHS.HOME)}
        className="text-text-muted hover:text-foreground flex items-center gap-2 text-sm transition-colors group w-fit mb-8"
      >
        <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>{" "}
        Back to Home
      </button>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-between items-end gap-6 mb-12"
      >
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary w-fit">
            <span className="material-symbols-outlined text-[14px]">
              psychology
            </span>{" "}
            Expert Guidance
          </div>
          <h1 className="text-foreground text-5xl md:text-6xl font-display font-light leading-tight tracking-[-0.033em]">
            Connect with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200 font-bold">
              a Guide
            </span>
          </h1>
          <p className="text-text-muted text-lg font-light leading-relaxed">
            Find your spiritual advisor among our expert astrologers, tarot
            readers, and feng shui masters.
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface border border-surface-border text-sm font-medium hover:bg-surface-border/30 transition-colors md:hidden text-foreground">
          <span className="material-symbols-outlined text-[20px]">
            filter_list
          </span>{" "}
          Filters
        </button>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-10">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden md:flex flex-col w-56 lg:w-72 shrink-0 gap-6 lg:gap-8 h-fit sticky top-24"
        >
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <h3 className="text-foreground text-xl font-bold font-display">
              Filters
            </h3>
            <button className="text-xs text-primary font-bold uppercase tracking-wider hover:text-primary-hover transition-colors">
              Reset
            </button>
          </div>
          <div className="flex flex-col gap-5">
            <p className="text-text-muted text-xs font-bold uppercase tracking-widest">
              Expertise
            </p>
            {[
              "Astrology",
              "Tarot Reading",
              "Feng Shui",
              "Dream Interpretation",
              "Numerology",
            ].map((e) => (
              <label
                key={e}
                className="flex gap-x-3 items-center cursor-pointer group"
              >
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer appearance-none h-4 w-4 border border-surface-border rounded bg-surface-border/30 checked:bg-primary checked:border-primary transition-all"
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-black opacity-0 peer-checked:opacity-100 material-symbols-outlined text-[12px] pointer-events-none">
                    check
                  </span>
                </div>
                <span className="text-text-muted text-sm group-hover:text-foreground transition-colors">
                  {e}
                </span>
              </label>
            ))}
          </div>
        </motion.aside>

        <motion.div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-text-muted tracking-widest uppercase italic">
              Searching the cosmos for available guides...
            </div>
          ) : (
            experts.map((expert, index) => (
              <ExpertCard
                key={expert.id}
                index={index}
                name={expert.name}
                title={expert.title || "Spiritual Guide"}
                rating={expert.rating}
                reviews={expert.review_count}
                price={`${currencySymbol}${(expert.hourly_rate / 60).toFixed(2)}/min`}
                tags={expert.specialties}
                image={expert.avatar_url}
                isOnline={false}
                onBook={() => navigate(`${PATHS.BOOKING}?expert=${expert.id}`)}
                onProfile={() => navigate(PATHS.EXPERT(expert.id))}
              />
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};
