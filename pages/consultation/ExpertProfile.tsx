import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { GlowButton } from "../../components/GlowButton";
import { supabase } from "../../services/supabase";

export const ExpertProfile: React.FC = () => {
  const navigate = useNavigate();
  const { expertId } = useParams<{ expertId: string }>();
  const [expert, setExpert] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-muted tracking-widest uppercase text-xs animate-pulse">
          Communing with the guide...
        </div>
      </div>
    );
  }

  if (!expert) return <div>Expert not found</div>;

  return (
    <div className="flex-1 bg-silk-pattern relative bg-background min-h-screen pb-20">
      <div className="relative h-[40vh] min-h-[400px]">
        <div className="absolute inset-0">
          <img
            src={expert.avatar_url}
            className="w-full h-full object-cover"
            alt={expert.name}
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 flex flex-col md:flex-row items-end justify-between gap-8 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate(PATHS.EXPERTS)}
              className="text-text-muted hover:text-foreground flex items-center gap-2 text-sm transition-colors w-fit mb-2"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              Back to Experts
            </button>
            <div className="flex flex-wrap gap-3">
              {expert.specialties?.map((t: string) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full bg-surface/50 border border-surface-border text-foreground text-xs font-bold uppercase tracking-wider backdrop-blur-md"
                >
                  {t}
                </span>
              ))}
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-light text-foreground leading-none">
              {expert.name}
            </h1>
            <p className="text-xl md:text-2xl text-primary font-serif italic">
              {expert.title}
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl bg-surface/50 border border-surface-border backdrop-blur-md min-w-[300px]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex text-[#F4C025]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-lg fill-1"
                  >
                    star
                  </span>
                ))}
              </div>
              <span className="text-foreground font-bold text-lg">
                {expert.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-text-muted text-sm mb-6">
              {expert.review_count} consultations completed
            </p>
            <GlowButton
              onClick={() => navigate(`${PATHS.BOOKING}?expert=${expertId}`)}
              className="w-full font-bold"
              icon="calendar_month"
            >
              Book Session
            </GlowButton>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-16 space-y-16">
        <section>
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 border-l-4 border-primary pl-4">
            About
          </h2>
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-foreground/80 leading-relaxed font-light text-lg">
              {expert.bio || "No biography available."}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-display font-bold text-foreground mb-6 border-l-4 border-primary pl-4">
            Specialties
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(
              expert.specialties || [
                "General Guidance",
                "Life Path",
                "Relationships",
              ]
            ).map((s: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-xl bg-surface-border/30 border border-surface-border"
              >
                <span className="material-symbols-outlined text-primary mt-1">
                  auto_awesome
                </span>
                <div>
                  <h4 className="text-foreground font-bold mb-1">{s}</h4>
                  <p className="text-text-muted text-sm">
                    Deep insight and actionable guidance in this area.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
