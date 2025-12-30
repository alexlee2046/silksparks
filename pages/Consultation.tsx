import React, { useState } from "react";
import { Screen, NavProps } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import { supabase } from "../services/supabase";

export const Experts: React.FC<NavProps> = ({ setScreen, setExpertId }) => {
  const [experts, setExperts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchExperts = async () => {
      const { data, error } = await supabase
        .from("experts")
        .select("*")
        .order("rating", { ascending: false });

      if (!error && data) {
        setExperts(data);
      }
      setLoading(false);
    };
    fetchExperts();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  return (
    <div className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-10 bg-background-dark min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => setScreen(Screen.HOME)}
        className="text-text-muted hover:text-white flex items-center gap-2 text-sm transition-colors group w-fit mb-8"
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
          <h1 className="text-white text-5xl md:text-6xl font-display font-light leading-tight tracking-[-0.033em]">
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
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-dark border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors md:hidden text-white">
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
          className="hidden md:flex flex-col w-72 shrink-0 gap-8 h-fit sticky top-24"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-white text-xl font-bold font-display">
              Filters
            </h3>
            <button className="text-xs text-primary font-bold uppercase tracking-wider hover:text-primary-hover transition-colors">
              Reset
            </button>
          </div>
          <div className="flex flex-col gap-5">
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
              Expertise
            </p>
            {[
              "Astrology",
              "Tarot Reading",
              "Feng Shui",
              "Dream Interpretation",
              "Numerology",
            ].map((e, i) => (
              <label
                key={e}
                className="flex gap-x-3 items-center cursor-pointer group"
              >
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer appearance-none h-4 w-4 border border-white/20 rounded bg-white/5 checked:bg-primary checked:border-primary transition-all"
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-black opacity-0 peer-checked:opacity-100 material-symbols-outlined text-[12px] pointer-events-none">
                    check
                  </span>
                </div>
                <span className="text-white/70 text-sm group-hover:text-white transition-colors">
                  {e}
                </span>
              </label>
            ))}
          </div>
        </motion.aside>

        <motion.div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-white/20 tracking-widest uppercase italic">
              Searching the cosmos for available guides...
            </div>
          ) : (
            experts.map((expert, index) => (
              <ExpertCard
                key={expert.id}
                index={index}
                name={expert.name}
                title={expert.title}
                rating={expert.rating.toFixed(1)}
                reviews={expert.review_count}
                price={`$${expert.price_per_min}/min`}
                tags={expert.tags || []}
                image={expert.image_url}
                isOnline={expert.is_online}
                onBook={() => {
                  if (setExpertId) setExpertId(expert.id);
                  setScreen(Screen.BOOKING);
                }}
              />
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

const ExpertCard = ({
  name,
  title,
  rating,
  reviews,
  price,
  tags,
  image,
  isOnline,
  onBook,
  index,
}: any) => (
  <div
    className="animate-fade-in-up"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <GlassCard
      hoverEffect
      interactive
      className="flex flex-col h-full group p-0 overflow-hidden bg-surface-dark/40"
    >
      <div
        className="relative aspect-[4/3] w-full bg-cover bg-top group-hover:scale-105 transition-transform duration-700"
        style={{ backgroundImage: `url('${image}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent opacity-90"></div>
        {isOnline && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">
              Online
            </span>
          </div>
        )}
        <div className="absolute bottom-3 right-3 bg-primary text-background-dark font-bold text-xs px-2 py-1 rounded shadow-lg shadow-black/50">
          {price}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1 relative bg-surface-dark/80 backdrop-blur-xl border-t border-white/5">
        <div className="space-y-1">
          <h3 className="text-white text-xl font-bold font-display group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-white/60 text-sm font-medium">{title}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex text-primary text-[14px]">
            <span className="material-symbols-outlined fill">star</span>
            <span className="material-symbols-outlined fill">star</span>
            <span className="material-symbols-outlined fill">star</span>
            <span className="material-symbols-outlined fill">star</span>
            <span className="material-symbols-outlined fill">star</span>
          </div>
          <span className="text-white font-bold text-sm">{rating}</span>
          <span className="text-white/40 text-xs">({reviews} reviews)</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((t: string) => (
            <span
              key={t}
              className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-wider group-hover:border-primary/20 transition-colors"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4 flex gap-3">
          <button className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-colors">
            Profile
          </button>
          <button
            onClick={onBook}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-background-dark text-sm font-bold hover:bg-white hover:text-black transition-colors shadow-[0_0_15px_-3px_rgba(244,192,37,0.3)]"
          >
            Book
          </button>
        </div>
      </div>
    </GlassCard>
  </div>
);

export const Booking: React.FC<NavProps> = ({ setScreen, expertId }) => {
  const [expert, setExpert] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = React.useState<Date[]>([]);
  const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);

  // Fetch Expert
  React.useEffect(() => {
    const fetchExpert = async () => {
      if (!expertId) return;

      const { data, error } = await supabase
        .from("experts")
        .select("*")
        .eq("id", expertId)
        .single();

      if (!error && data) {
        setExpert(data);
      }
      setLoading(false);
    };
    fetchExpert();
  }, [expertId]);

  // Generate Calendar
  React.useEffect(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    setCalendarDays(days);
  }, []);

  // Fetch Slots
  React.useEffect(() => {
    const fetchSlots = async () => {
      if (!expertId) return;
      const dayOfWeek = selectedDate.getDay();

      // Fetch availability rule
      const { data: avail } = await supabase
        .from("expert_availability")
        .select("*")
        .eq("expert_id", expertId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_available", true);

      if (avail && avail.length > 0) {
        // Generate slots based on start/end time
        // Simple logic: hourly slots
        // In real app: check existing 'consultations' to exclude booked slots
        const slots = [];
        // Mock generation for now based on DB rule
        // e.g. 09:00:00 -> 9, 17:00:00 -> 17
        const start = parseInt(avail[0].start_time.split(":")[0]);
        const end = parseInt(avail[0].end_time.split(":")[0]);

        for (let h = start; h < end; h++) {
          slots.push(`${h}:00 ${h < 12 ? "AM" : "PM"}`);
        }
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    };
    fetchSlots();
    setSelectedSlot(null);
  }, [selectedDate, expertId]);

  const handleConfirm = () => {
    // Save draft booking data
    const bookingData = {
      expertId,
      expertName: expert.name,
      expertImage: expert.image_url,
      price: expert.price_per_min,
      date: selectedDate,
      time: selectedSlot,
    };
    localStorage.setItem("booking_draft", JSON.stringify(bookingData));
    setScreen(Screen.INTAKE);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-white/40 tracking-widest uppercase text-xs animate-pulse">
          Aligning schedules...
        </div>
      </div>
    );
  }

  if (!expert) return <div>Expert not found</div>;

  return (
    <div className="flex-1 bg-silk-pattern relative bg-background-dark min-h-screen">
      <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-12 md:py-16">
        {/* Back Button */}
        <button
          onClick={() => setScreen(Screen.EXPERTS)}
          className="text-text-muted hover:text-white flex items-center gap-2 text-sm transition-colors group w-fit mb-8"
        >
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>{" "}
          Back to Experts
        </button>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-amber-300 to-primary rounded-full opacity-50 group-hover:opacity-100 blur transition duration-500 animate-gradient bg-[length:200%_auto]"></div>
            <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-2 border-background-dark">
              <img
                alt="Expert Avatar"
                className="h-full w-full object-cover"
                src={expert.image_url}
              />
            </div>
          </div>
          <div className="text-center md:text-left flex-1 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
              <h1 className="text-4xl md:text-5xl font-light text-white font-display">
                {expert.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest w-fit mx-auto md:mx-0 shadow-[0_0_10px_rgba(244,192,37,0.2)]">
                <span className="material-symbols-outlined text-[14px]">
                  verified
                </span>{" "}
                Verified Expert
              </span>
            </div>
            <p className="text-text-muted text-lg max-w-2xl font-light">
              {expert.title}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4"
          >
            <GlassCard className="p-6 h-full">
              <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  auto_awesome
                </span>
                Selected Service
              </h3>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-white text-xl group-hover:text-primary transition-colors">
                    Standard Consultation
                  </h4>
                  <span className="text-primary font-bold text-xl">
                    ${(expert.price_per_min * 30).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-white/50 mb-6 font-light leading-relaxed truncate-2-lines">
                  30-minute deep dive session focusing on your specific
                  questions and chart analysis.
                </p>
                <div className="flex items-center gap-4 text-xs text-white/40 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      schedule
                    </span>
                    30 min
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-8"
          >
            <GlassCard className="p-0 overflow-hidden h-full">
              <div className="flex flex-col md:flex-row h-full min-h-[500px]">
                {/* DATE SELECTOR */}
                <div className="p-8 md:w-1/2 md:border-r border-white/10 flex flex-col bg-surface-dark/30">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white font-display">
                      Select Date
                    </h2>
                  </div>

                  <div className="grid grid-cols-4 gap-2 w-full flex-grow content-start overflow-y-auto max-h-[400px]">
                    {calendarDays.map((date, i) => {
                      const isSelected =
                        date.getDate() === selectedDate.getDate();
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedDate(date)}
                          className={`
                            aspect-square w-full flex flex-col items-center justify-center rounded-xl text-sm transition-all relative group
                            ${
                              isSelected
                                ? "bg-primary text-background-dark font-bold shadow-[0_0_20px_rgba(244,192,37,0.4)]"
                                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5"
                            }
                          `}
                        >
                          <span className="text-[10px] uppercase opacity-60">
                            {date.toLocaleDateString("en-US", {
                              weekday: "short",
                            })}
                          </span>
                          <span className="text-lg">{date.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SLOT SELECTOR */}
                <div className="p-8 md:w-1/2 bg-black/40 flex flex-col">
                  <div className="mb-10">
                    <h3 className="text-2xl font-bold text-white mb-2 font-display tracking-tight">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </h3>
                    <p className="text-xs text-primary flex items-center gap-2 font-black uppercase tracking-[0.1em]">
                      <span className="material-symbols-outlined text-[16px]">
                        check_circle
                      </span>
                      {availableSlots.length} available slots
                    </p>
                  </div>

                  <div className="flex-1 space-y-4 max-h-[300px] overflow-y-auto">
                    {availableSlots.length > 0 ? (
                      availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`group relative flex items-center justify-between w-full p-4 rounded-xl border transition-all duration-300
                             ${
                               selectedSlot === slot
                                 ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(244,192,37,0.1)]"
                                 : "border-white/5 bg-white/5 hover:bg-white/10"
                             }
                            `}
                        >
                          <span
                            className={`text-sm font-bold ${selectedSlot === slot ? "text-white" : "text-white/60"}`}
                          >
                            {slot}
                          </span>
                          {selectedSlot === slot && (
                            <span className="material-symbols-outlined text-primary text-sm">
                              check
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="text-white/30 text-sm">
                        No availability on this day.
                      </p>
                    )}
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10">
                    <GlowButton
                      disabled={!selectedSlot}
                      onClick={handleConfirm}
                      className="w-full h-14 text-base font-bold disabled:opacity-50 disabled:grayscale"
                      icon="arrow_forward"
                    >
                      Confirm Time
                    </GlowButton>
                    <p className="text-[10px] text-center text-white/20 mt-4 uppercase font-bold tracking-widest">
                      Step 1 of 3: Selection
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export const Intake: React.FC<NavProps> = ({ setScreen }) => {
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
    setScreen(Screen.DELIVERY);
  };

  return (
    <div className="flex-1 bg-background-dark bg-silk-pattern py-16 min-h-screen">
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
          <h1 className="text-5xl md:text-6xl font-display font-light text-white mb-6 leading-tight">
            Consultation{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
              Intake
            </span>
          </h1>
          <p className="text-white/50 text-xl font-light max-w-2xl mx-auto">
            Help your guide prepare for your session by sharing your current
            energy and intent.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-0 overflow-hidden border-white/5 shadow-2xl">
            <form className="relative" onSubmit={handleSubmit}>
              <div className="p-8 md:p-12 space-y-12">
                <section className="space-y-8">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-display">
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
                        <div className="h-full rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center group-hover:border-primary/30 group-hover:bg-white/[0.05] peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all flex flex-col items-center gap-4 justify-center min-h-[140px] relative overflow-hidden">
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
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-display">
                      <span className="h-8 w-1 bg-primary rounded-full"></span>
                      Your Questions
                    </h2>
                    <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">
                      Optional but recommended
                    </span>
                  </div>
                  <div className="relative group">
                    <textarea
                      className="block w-full rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5 text-white placeholder-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none shadow-inner min-h-[160px] text-lg font-light leading-relaxed"
                      placeholder="Share your specific questions or areas where you feel blocked..."
                      value={questions}
                      onChange={(e) => setQuestions(e.target.value)}
                    ></textarea>
                    <div className="absolute bottom-4 right-4 text-[10px] text-white/20 uppercase font-bold tracking-widest pointer-events-none group-focus-within:text-primary/40 transition-colors">
                      Max 1000 characters
                    </div>
                  </div>
                </section>
              </div>

              <div className="bg-black/40 border-t border-white/5 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <button
                  type="button"
                  onClick={() => setScreen(Screen.BOOKING)}
                  className="text-white/40 hover:text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
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

export const Delivery: React.FC<NavProps> = ({ setScreen, expertId }) => {
  const { addItem, setIsCartOpen } = useCart(); // Use Cart Context instead of direct order creation
  const [expert, setExpert] = React.useState<any>(null);

  React.useEffect(() => {
    // If expertId is missing, try to recover from draft
    if (!expertId) {
      const draft = localStorage.getItem("booking_draft");
      if (draft) {
        const data = JSON.parse(draft);
        if (data.expertId) {
          // We should ideally setExpertId in parent or handle it here.
          // For now, let's just fetch by ID from draft.
          supabase
            .from("experts")
            .select("*")
            .eq("id", data.expertId)
            .single()
            .then(({ data }) => setExpert(data));
        }
      }
    } else {
      supabase
        .from("experts")
        .select("*")
        .eq("id", expertId)
        .single()
        .then(({ data }) => setExpert(data));
    }
  }, [expertId]);

  const handleSelect = async (deliveryType: string) => {
    const draft = localStorage.getItem("booking_draft");
    if (!draft) return;

    const bookingData = JSON.parse(draft);
    const expertName = expert
      ? expert.name
      : bookingData.expertName || "Expert Guide";
    const price = expert
      ? expert.price_per_min * 30
      : bookingData.price * 30 || 120.0; // 30 mins

    // Add to Cart
    addItem({
      id: `consultation-${Date.now()}`, // Temporary ID for cart item
      name: `${deliveryType} with ${expertName}`,
      price: price,
      description: `30 min session on ${new Date(bookingData.date).toLocaleDateString()} at ${bookingData.time}`,
      image: expert?.image_url || bookingData.expertImage,
      type: "consultation",
      // Store full booking metadata in a custom field if Cart supports it,
      // or we just keep it in localStorage and link it during checkout.
      // For Phase 3 MVP, let's store it in localStorage key 'pending_consultation' or just assume the last draft is valid.
      // Better: The CartContext should support 'metadata'.
      // But we haven't updated CartContext yet.
      // Let's attach it to the item object even if TS complains, or just use localStorage.
      metadata: {
        ...bookingData,
        deliveryType,
        duration: 30,
      },
    } as any); // Cast to any to bypass type check for 'metadata' for now

    setIsCartOpen(true);
    // setScreen(Screen.USER_DASHBOARD); // Don't redirect to dashboard, open cart instead.
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 bg-background-dark bg-silk-pattern min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-5xl w-full flex flex-col gap-12"
      >
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/5 bg-white/[0.02] px-6 py-2 backdrop-blur-md mb-2 shadow-xl">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">
              Step 3 of 3: Completion
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-white font-display leading-tight">
            Choose Your <br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
              Delivery Method
            </span>
          </h1>
          <p className="text-white/40 text-xl font-light max-w-xl mx-auto">
            Select how you would like to receive your personalized guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <DeliveryOption
            title="Asynchronous Video"
            icon="videocam"
            desc="The expert will record a deep-dive personalized 10-minute video analysis for you to study at your own pace."
            action="Receive Video"
            onClick={() => handleSelect("Async Video")}
            delay={0.1}
          />
          <DeliveryOption
            title="Real-time Meeting"
            icon="video_chat"
            desc="Connect live via Zoom for a 60-minute interactive session. Best for dialogue and immediate clarification."
            action="Schedule Live Session"
            onClick={() => handleSelect("Live Session")}
            delay={0.2}
          />
        </div>

        <button
          onClick={() => setScreen(Screen.INTAKE)}
          className="mx-auto text-white/30 hover:text-white text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all mt-4"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Refine Intake Details
        </button>
      </motion.div>
    </div>
  );
};

const DeliveryOption = ({ title, icon, desc, action, onClick, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    onClick={onClick}
    className="h-full flex flex-col"
  >
    <GlassCard
      hoverEffect
      interactive
      className="flex flex-col flex-1 bg-white/[0.02] border-white/5 group overflow-hidden p-0 rounded-3xl"
    >
      <div className="flex flex-col flex-1 h-full">
        <div className="p-10 flex flex-col items-center text-center flex-1">
          <div className="mb-8 flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/5 text-primary border border-primary/10 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(244,192,37,0.2)] transition-all duration-500 transform rotate-3 group-hover:rotate-0">
            <span className="material-symbols-outlined text-[44px]">
              {icon}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-4 font-display">
            {title}
          </h3>
          <p className="text-white/40 leading-relaxed mb-8 flex-1 font-light text-lg">
            {desc}
          </p>
        </div>
        <div className="p-8 pt-0 w-full mt-auto">
          <button className="w-full py-5 px-8 rounded-2xl bg-white/5 border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/10 text-white font-bold transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-[0.2em] group-hover:text-primary shadow-xl">
            {action}
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </GlassCard>
  </motion.div>
);
