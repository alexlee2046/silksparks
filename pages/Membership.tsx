import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PATHS } from "../lib/paths";
import { useUser } from "../context/UserContext";
import { supabase } from "../services/supabase";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import toast from "react-hot-toast";

// ============ Types ============

interface Subscription {
  id: string;
  plan: "monthly" | "yearly";
  status: "active" | "cancelled" | "past_due" | "expired";
  current_period_start: string;
  current_period_end: string;
}

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

// ============ Plan Card Component ============

interface PlanCardProps {
  name: string;
  price: number;
  period: "month" | "year";
  originalPrice?: number;
  features: PlanFeature[];
  isPopular?: boolean;
  isCurrent?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  period,
  originalPrice,
  features,
  isPopular,
  isCurrent,
  onSelect,
  isLoading,
}) => {
  const savings = originalPrice ? originalPrice - price : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="px-4 py-1 bg-gradient-to-r from-primary to-amber-400 text-background-dark text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
            Best Value
          </div>
        </div>
      )}

      <GlassCard
        className={`p-8 h-full flex flex-col ${
          isPopular
            ? "border-primary/50 shadow-[0_0_30px_rgba(244,192,37,0.15)]"
            : ""
        } ${isCurrent ? "ring-2 ring-primary" : ""}`}
        intensity={isPopular ? "high" : "medium"}
      >
        {/* Plan Name */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-foreground mb-2">{name}</h3>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-display font-bold text-foreground">${price}</span>
            <span className="text-text-muted">/{period}</span>
          </div>
          {savings > 0 && (
            <div className="mt-2">
              <span className="text-text-muted line-through text-sm">${originalPrice}/{period}</span>
              <span className="ml-2 text-emerald-400 font-bold text-sm">Save ${savings}</span>
            </div>
          )}
        </div>

        {/* Features List */}
        <div className="flex-1 space-y-4 mb-8">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span
                className={`material-symbols-outlined text-lg mt-0.5 ${
                  feature.included
                    ? feature.highlight
                      ? "text-primary"
                      : "text-emerald-400"
                    : "text-text-muted/30"
                }`}
              >
                {feature.included ? "check_circle" : "cancel"}
              </span>
              <span
                className={`text-sm ${
                  feature.included
                    ? feature.highlight
                      ? "text-foreground font-medium"
                      : "text-foreground"
                    : "text-text-muted/50 line-through"
                }`}
              >
                {feature.text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        {isCurrent ? (
          <div className="text-center py-3 bg-primary/10 rounded-xl border border-primary/30">
            <span className="text-primary font-bold flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">verified</span>
              Current Plan
            </span>
          </div>
        ) : (
          <GlowButton
            variant={isPopular ? "cosmic" : "primary"}
            onClick={onSelect}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Processing..." : "Subscribe Now"}
          </GlowButton>
        )}
      </GlassCard>
    </motion.div>
  );
};

// ============ Benefits Section ============

const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: "style",
      title: "Unlimited Tarot Readings",
      desc: "Draw cards as many times as you want, no daily limits",
    },
    {
      icon: "calendar_month",
      title: "12-Month Forecast",
      desc: "Get personalized monthly predictions for the entire year",
    },
    {
      icon: "support_agent",
      title: "15% Expert Discount",
      desc: "Save on all expert consultations and readings",
    },
    {
      icon: "priority_high",
      title: "Priority Support",
      desc: "Get faster responses from our customer support team",
    },
    {
      icon: "workspace_premium",
      title: "Exclusive Badge",
      desc: "Show off your premium status with a special profile badge",
    },
    {
      icon: "auto_awesome",
      title: "Early Access",
      desc: "Be the first to try new features and products",
    },
  ];

  return (
    <div className="mt-20">
      <h2 className="text-3xl font-display font-bold text-foreground text-center mb-12">
        Premium{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">
          Benefits
        </span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, idx) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <GlassCard className="p-6 h-full" intensity="low" hoverEffect>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl text-primary">
                    {benefit.icon}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">{benefit.title}</h4>
                  <p className="text-sm text-text-muted">{benefit.desc}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============ FAQ Section ============

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Can I cancel anytime?",
      a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal through our secure Stripe payment system.",
    },
    {
      q: "Is there a free trial?",
      a: "We don't offer a free trial, but you can use the free tier with limited daily readings to test our service before subscribing.",
    },
    {
      q: "Can I switch between monthly and yearly plans?",
      a: "Yes, you can switch plans at any time. If you upgrade, you'll be charged the prorated difference. If you downgrade, the change takes effect at the next billing cycle.",
    },
    {
      q: "What happens to my data if I cancel?",
      a: "Your readings and reports are saved in your archive forever, even if you cancel. You just won't be able to generate new unlimited readings.",
    },
  ];

  return (
    <div className="mt-20">
      <h2 className="text-3xl font-display font-bold text-foreground text-center mb-12">
        Frequently Asked Questions
      </h2>
      <div className="max-w-2xl mx-auto space-y-4">
        {faqs.map((faq, idx) => (
          <GlassCard
            key={idx}
            className="overflow-hidden"
            intensity="low"
            interactive
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
          >
            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-bold text-foreground">{faq.q}</h4>
                <span
                  className={`material-symbols-outlined text-primary transition-transform ${
                    openIndex === idx ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </div>
              {openIndex === idx && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-text-muted text-sm mt-4 pt-4 border-t border-surface-border"
                >
                  {faq.a}
                </motion.p>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

// ============ Main Membership Page ============

export const Membership: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<"monthly" | "yearly" | null>(null);

  // Fetch current subscription
  useEffect(() => {
    async function fetchSubscription() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("subscriptions")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("status", "active")
          .single();

        if (!error && data) {
          setSubscription(data as Subscription);
        }
      } catch (err) {
        console.error("[Membership] Failed to fetch subscription:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [session]);

  // Handle subscription checkout
  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    if (!session) {
      toast.error("Please sign in to subscribe");
      navigate(PATHS.DASHBOARD);
      return;
    }

    setProcessingPlan(plan);
    try {
      // Call Edge Function to create Stripe Checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          mode: "subscription",
          plan,
          successUrl: `${window.location.origin}/membership?success=true`,
          cancelUrl: `${window.location.origin}/membership?canceled=true`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("[Membership] Checkout error:", err);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setProcessingPlan(null);
    }
  };

  // Handle success/cancel URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Welcome to Premium! Your subscription is now active.");
      // Clear URL params
      window.history.replaceState({}, "", "/membership");
    } else if (params.get("canceled") === "true") {
      toast("Subscription canceled. You can try again anytime.");
      window.history.replaceState({}, "", "/membership");
    }
  }, []);

  const monthlyFeatures: PlanFeature[] = [
    { text: "Unlimited Tarot Readings", included: true, highlight: true },
    { text: "12-Month Forecast Access", included: true, highlight: true },
    { text: "15% Expert Consultation Discount", included: true },
    { text: "Priority Support", included: true },
    { text: "Exclusive Premium Badge", included: true },
    { text: "Early Access to New Features", included: true },
  ];

  const yearlyFeatures: PlanFeature[] = [
    { text: "Everything in Monthly", included: true },
    { text: "Save $40 per year", included: true, highlight: true },
    { text: "Exclusive Annual Bonus Points", included: true, highlight: true },
    { text: "Priority Support", included: true },
    { text: "Exclusive Premium Badge", included: true },
    { text: "Early Access to New Features", included: true },
  ];

  const isPremium = subscription?.status === "active";
  const currentPlan = subscription?.plan;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-8 lg:px-12">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate(PATHS.DASHBOARD)}
            className="text-text-muted hover:text-foreground flex items-center gap-2 text-sm transition-colors group mb-6 mx-auto"
          >
            <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            Back to Dashboard
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <span className="text-primary font-bold text-sm uppercase tracking-wider">
                Premium Membership
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight">
              Unlock Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-primary">
                Full Cosmic Potential
              </span>
            </h1>

            <p className="text-text-muted max-w-2xl mx-auto text-lg">
              Get unlimited readings, exclusive forecasts, and premium perks with our membership plans.
            </p>
          </motion.div>
        </div>

        {/* Current Member Badge */}
        {isPremium && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10"
          >
            <GlassCard className="p-6 text-center border-primary/50" intensity="high">
              <div className="flex items-center justify-center gap-3">
                <span className="material-symbols-outlined text-3xl text-primary">
                  workspace_premium
                </span>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    You're a Premium Member!
                  </h3>
                  <p className="text-text-muted text-sm">
                    {currentPlan === "yearly" ? "Annual" : "Monthly"} plan - Valid until{" "}
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PlanCard
            name="Monthly"
            price={9.99}
            period="month"
            features={monthlyFeatures}
            isCurrent={currentPlan === "monthly"}
            onSelect={() => handleSubscribe("monthly")}
            isLoading={processingPlan === "monthly"}
          />
          <PlanCard
            name="Annual"
            price={79.99}
            period="year"
            originalPrice={119.88}
            features={yearlyFeatures}
            isPopular
            isCurrent={currentPlan === "yearly"}
            onSelect={() => handleSubscribe("yearly")}
            isLoading={processingPlan === "yearly"}
          />
        </div>

        {/* Free vs Premium Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">
            Free vs Premium
          </h2>
          <GlassCard className="overflow-hidden" intensity="medium">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left p-4 text-foreground font-bold">Feature</th>
                    <th className="text-center p-4 text-text-muted font-medium">Free</th>
                    <th className="text-center p-4 text-primary font-bold">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Daily Tarot Readings", free: "3 per day", premium: "Unlimited" },
                    { feature: "Birth Chart Analysis", free: "Yes", premium: "Yes" },
                    { feature: "12-Month Forecast", free: "No", premium: "Yes" },
                    { feature: "Expert Consultation Discount", free: "No", premium: "15% off" },
                    { feature: "Priority Support", free: "No", premium: "Yes" },
                    { feature: "Premium Badge", free: "No", premium: "Yes" },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-surface-border/50 last:border-0">
                      <td className="p-4 text-foreground">{row.feature}</td>
                      <td className="p-4 text-center text-text-muted">{row.free}</td>
                      <td className="p-4 text-center text-primary font-medium">{row.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>

        {/* Benefits Section */}
        <BenefitsSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 text-text-muted">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">lock</span>
              <span className="text-sm">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">verified_user</span>
              <span className="text-sm">Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">support</span>
              <span className="text-sm">24/7 Support</span>
            </div>
          </div>
          <p className="text-text-muted/60 text-xs mt-4">
            Powered by Stripe. Your payment information is secure and encrypted.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Membership;
