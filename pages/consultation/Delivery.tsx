import React from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../lib/paths";
import { motion } from "framer-motion";
import { useCart } from "../../context/CartContext";
import { supabase } from "../../services/supabase";
import { DeliveryOption } from "./DeliveryOption";

export const Delivery: React.FC = () => {
  const navigate = useNavigate();
  const { addItem, setIsCartOpen } = useCart();
  const [expert, setExpert] = React.useState<any>(null);

  React.useEffect(() => {
    // Get expertId from localStorage booking draft
    const draft = localStorage.getItem("booking_draft");
    if (draft) {
      const data = JSON.parse(draft);
      if (data.expertId) {
        supabase
          .from("experts")
          .select("*")
          .eq("id", data.expertId)
          .single()
          .then(({ data }) => setExpert(data));
      }
    }
  }, []);

  const handleSelect = async (deliveryType: string) => {
    const draft = localStorage.getItem("booking_draft");
    if (!draft) return;

    const bookingData = JSON.parse(draft);
    const expertName = expert
      ? expert.name
      : bookingData.expertName || "Expert Guide";
    const price = expert
      ? (expert.hourly_rate / 60) * 30
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
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 bg-background bg-silk-pattern min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-5xl w-full flex flex-col gap-12"
      >
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-surface-border bg-surface-border/10 px-6 py-2 backdrop-blur-md mb-2 shadow-xl">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">
              Step 3 of 3: Completion
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-foreground font-display leading-tight">
            Choose Your <br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
              Delivery Method
            </span>
          </h1>
          <p className="text-text-muted text-xl font-light max-w-xl mx-auto">
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
          onClick={() => navigate(PATHS.BOOKING_INTAKE)}
          className="mx-auto text-text-muted hover:text-foreground text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all mt-4"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Refine Intake Details
        </button>
      </motion.div>
    </div>
  );
};
