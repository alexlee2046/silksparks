import React from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/GlassCard";
import { GlowButton } from "../../components/GlowButton";

export const Intake: React.FC = () => {
  const navigate = useNavigate();
  const [focus, setFocus] = React.useState("");
  const [questions, setQuestions] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Persist intake data
    const draft = localStorage.getItem("booking_draft");
    if (draft) {
      const data = JSON.parse(draft);
      const updatedData = { ...data, intake: { focus, questions } };
      localStorage.setItem("booking_draft", JSON.stringify(updatedData));
    }
    navigate(PATHS.BOOKING_DELIVERY);
  };

  return (
    <div className="flex-1 bg-background bg-silk-pattern py-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center justify-center gap-3 text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-6 bg-primary/5 border border-primary/20 px-6 py-2 rounded-full shadow-[0_0_15px_rgba(244,192,37,0.1)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Step 2 of 3: Consultation Details
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-light text-foreground mb-6 leading-tight">
            Consultation{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
              Intake
            </span>
          </h1>
          <p className="text-text-muted text-xl font-light max-w-2xl mx-auto">
            Help your guide prepare for your session by sharing your current
            energy and intent.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-0 overflow-hidden border-surface-border shadow-2xl">
            <form className="relative" onSubmit={handleSubmit}>
              <div className="p-8 md:p-12 space-y-12">
                <section className="space-y-8">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 font-display">
                    <span className="h-8 w-1 bg-primary rounded-full"></span>
                    What is your focus today?
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { l: "Love & Relationships", i: "favorite" },
                      { l: "Career & Purpose", i: "work" },
                      { l: "Personal Growth", i: "self_improvement" },
                      { l: "Specific Event", i: "event" },
                    ].map((f) => (
                      <label
                        key={f.l}
                        className="cursor-pointer group relative"
                      >
                        <input
                          type="radio"
                          name="focus"
                          className="peer sr-only"
                          value={f.l}
                          onChange={(e) => setFocus(e.target.value)}
                          required
                        />
                        <div className="h-full rounded-2xl border border-surface-border bg-surface-border/10 p-6 text-center group-hover:border-primary/30 group-hover:bg-surface-border/30 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all flex flex-col items-center gap-4 justify-center min-h-[140px] relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 peer-checked:opacity-100 transition-opacity" />
                          <span className="material-symbols-outlined text-[32px] opacity-30 group-hover:opacity-60 peer-checked:opacity-100 transition-all transform group-hover:scale-110">
                            {f.i}
                          </span>
                          <span className="text-xs font-black uppercase tracking-widest leading-tight">
                            {f.l}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex justify-between items-end">
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 font-display">
                      <span className="h-8 w-1 bg-primary rounded-full"></span>
                      Your Questions
                    </h2>
                    <span className="text-[10px] text-text-muted uppercase font-black tracking-widest">
                      Optional but recommended
                    </span>
                  </div>
                  <div className="relative group">
                    <textarea
                      className="block w-full rounded-2xl border border-surface-border bg-surface-border/10 px-6 py-5 text-foreground placeholder-text-muted focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none shadow-inner min-h-[160px] text-lg font-light leading-relaxed"
                      placeholder="Share your specific questions or areas where you feel blocked..."
                      value={questions}
                      onChange={(e) => setQuestions(e.target.value)}
                    ></textarea>
                    <div className="absolute bottom-4 right-4 text-[10px] text-text-muted uppercase font-bold tracking-widest pointer-events-none group-focus-within:text-primary/40 transition-colors">
                      Max 1000 characters
                    </div>
                  </div>
                </section>
              </div>

              <div className="bg-surface/50 border-t border-surface-border p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <button
                  type="button"
                  onClick={() => {
                    const draft = localStorage.getItem("booking_draft");
                    const expertId = draft ? JSON.parse(draft).expertId : null;
                    navigate(expertId ? `${PATHS.BOOKING}?expert=${expertId}` : PATHS.BOOKING);
                  }}
                  className="text-text-muted hover:text-foreground text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    arrow_back
                  </span>
                  Back to Calendar
                </button>
                <GlowButton
                  type="submit"
                  className="w-full md:w-auto px-12 h-14 text-base font-bold shadow-2xl"
                  icon="arrow_forward"
                >
                  Continue to Delivery
                </GlowButton>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};
