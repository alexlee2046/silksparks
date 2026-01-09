import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/GlassCard";
import { GlowButton } from "../../components/GlowButton";
import { useLocaleFormat } from "../../hooks/useLocaleFormat";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { supabase } from "../../services/supabase";
import type { Expert } from "../../types/database";

export const Booking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expertId = searchParams.get("expert");
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = React.useState<Date[]>([]);
  const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const { formatDate, formatCurrency } = useLocaleFormat();

  // Fetch Expert
  const { data: experts, loading } = useSupabaseQuery<Expert>({
    table: "experts",
    filter: (q) => q.eq("id", expertId!),
    enabled: !!expertId,
  });
  const expert = experts[0];

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
        // Fetch existing appointments for this expert on this day
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: existingApps } = await supabase
          .from("appointments")
          .select("booked_at")
          .eq("expert_id", expertId)
          .gte("booked_at", startOfDay.toISOString())
          .lte("booked_at", endOfDay.toISOString());

        const bookedHours = new Set(
          existingApps?.map((a) => new Date(a.booked_at).getHours()) || [],
        );

        // Generate slots based on start/end time
        const slots = [];
        const firstAvail = avail[0];
        const start = parseInt(firstAvail?.start_time?.split(":")[0] || "9");
        const end = parseInt(firstAvail?.end_time?.split(":")[0] || "17");

        for (let h = start; h < end; h++) {
          // Check if slot is booked
          if (!bookedHours.has(h)) {
            slots.push(`${h}:00 ${h < 12 ? "AM" : "PM"}`);
          }
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
    if (!expert) return;
    // Save draft booking data
    const bookingData = {
      expertId,
      expertName: expert.name,
      expertImage: expert.avatar_url,
      price: expert.hourly_rate / 60,
      date: selectedDate,
      time: selectedSlot,
    };
    localStorage.setItem("booking_draft", JSON.stringify(bookingData));
    navigate(PATHS.BOOKING_INTAKE);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-muted tracking-widest uppercase text-xs animate-pulse">
          Aligning schedules...
        </div>
      </div>
    );
  }

  if (!expert) return <div>Expert not found</div>;

  return (
    <div className="flex-1 bg-silk-pattern relative bg-background min-h-screen">
      <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-12 md:py-16">
        {/* Back Button */}
        <button
          onClick={() => navigate(PATHS.EXPERTS)}
          className="text-text-muted hover:text-foreground flex items-center gap-2 text-sm transition-colors group w-fit mb-8"
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
            <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-2 border-background">
              <img
                alt="Expert Avatar"
                className="h-full w-full object-cover"
                src={expert.avatar_url ?? undefined}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          <div className="text-center md:text-left flex-1 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
              <h1 className="text-4xl md:text-5xl font-light text-foreground font-display">
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
              <h3 className="text-foreground font-bold text-lg mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  auto_awesome
                </span>
                Selected Service
              </h3>
              <div className="bg-surface-border/30 rounded-2xl p-6 border border-surface-border hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-foreground text-xl group-hover:text-primary transition-colors">
                    Standard Consultation
                  </h4>
                  <span className="text-primary font-bold text-xl">
                    {formatCurrency((expert.hourly_rate / 60) * 30)}
                  </span>
                </div>
                <p className="text-sm text-text-muted mb-6 font-light leading-relaxed truncate-2-lines">
                  30-minute deep dive session focusing on your specific
                  questions and chart analysis.
                </p>
                <div className="flex items-center gap-4 text-xs text-text-muted font-bold uppercase tracking-widest">
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
                <div className="p-8 md:w-1/2 md:border-r border-surface-border flex flex-col bg-surface/30">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-foreground font-display">
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
                                ? "bg-primary text-background font-bold shadow-[0_0_20px_rgba(244,192,37,0.4)]"
                                : "bg-surface-border/30 text-text-muted hover:bg-surface-border/50 hover:text-foreground border border-surface-border"
                            }
                          `}
                        >
                          <span className="text-[10px] uppercase opacity-60">
                            {date.toLocaleDateString(undefined, { weekday: "short" })}
                          </span>
                          <span className="text-lg">{date.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SLOT SELECTOR */}
                <div className="p-8 md:w-1/2 bg-surface/50 flex flex-col">
                  <div className="mb-10">
                    <h3 className="text-2xl font-bold text-foreground mb-2 font-display tracking-tight">
                      {formatDate(selectedDate, "long")}
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
                                 : "border-surface-border bg-surface-border/30 hover:bg-surface-border/50"
                             }
                            `}
                        >
                          <span
                            className={`text-sm font-bold ${selectedSlot === slot ? "text-foreground" : "text-text-muted"}`}
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
                      <p className="text-text-muted text-sm">
                        No availability on this day.
                      </p>
                    )}
                  </div>

                  <div className="mt-8 pt-8 border-t border-surface-border">
                    <GlowButton
                      disabled={!selectedSlot}
                      onClick={handleConfirm}
                      className="w-full h-14 text-base font-bold disabled:opacity-50 disabled:grayscale"
                      icon="arrow_forward"
                    >
                      Confirm Time
                    </GlowButton>
                    <p className="text-[10px] text-center text-text-muted mt-4 uppercase font-bold tracking-widest">
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
