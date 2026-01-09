import React from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { useUser } from "../../context/UserContext";
import { motion } from "framer-motion";
import { GlassCard } from "../../components/GlassCard";
import { supabase } from "../../services/supabase";

export const Consultations: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [consultations, setConsultations] = React.useState<any[]>([]);
  const [_loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchConsultations = async () => {
      if (!user.id) {
        setLoading(false);
        return;
      }
      // Fetch from appointments table which holds the actual bookings
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          experts (
            name,
            image_url
          ),
          consultations (
            name,
            duration
          )
        `,
        )
        .eq("user_id", user.id)
        .order("booked_at", { ascending: false });

      if (!error && data) {
        setConsultations(data);
      }
      setLoading(false);
    };
    fetchConsultations();
  }, [user.id]);

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
          My <span className="font-bold text-primary">Consultations</span>
        </h1>
        <p className="text-text-muted font-light">
          Upcoming sessions and past guidance.
        </p>
      </motion.div>

      {consultations.length === 0 ? (
        <GlassCard className="text-center py-20 border-dashed border-surface-border bg-transparent flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-surface-border/30 flex items-center justify-center text-text-muted mb-4">
            <span className="material-symbols-outlined text-3xl">
              calendar_month
            </span>
          </div>
          <p className="text-text-muted">No consultations booked yet.</p>
          <button
            onClick={() => navigate(PATHS.EXPERTS)}
            className="text-primary mt-4 hover:text-foreground font-bold text-sm tracking-wide border-b border-primary/30 pb-0.5 hover:border-foreground transition-all"
          >
            Book a Session
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {consultations.map((c) => (
            <GlassCard
              key={c.id}
              className="p-6 border-surface-border flex flex-col md:flex-row gap-6 items-start md:items-center"
            >
              <div
                className="h-16 w-16 rounded-full bg-cover bg-center border border-surface-border"
                style={{ backgroundImage: `url('${c.experts?.image_url}')` }}
              ></div>
              <div className="flex-1">
                <h3 className="text-foreground font-bold text-lg">
                  {c.consultations?.name || "Consultation"} with{" "}
                  {c.experts?.name}
                </h3>
                <p className="text-text-muted text-sm flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-xs">
                    event
                  </span>
                  {new Date(c.booked_at).toLocaleString()}
                </p>
                {c.meeting_link && (
                  <a
                    href={c.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-xs font-bold uppercase tracking-wider mt-2 block hover:underline"
                  >
                    Join Meeting
                  </a>
                )}
              </div>
              <div className="px-3 py-1 rounded-full bg-surface-border/30 border border-surface-border text-xs font-bold uppercase tracking-widest text-text-muted">
                {c.status}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
