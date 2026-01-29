import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PATHS } from "../lib/paths";
import { useUser } from "../context/UserContext";
import { supabase } from "../services/supabase";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import toast from "react-hot-toast";

// Note: rewards, user_rewards, and subscriptions tables are defined in
// the design doc but may not exist in database.types.ts yet.
// Using type assertions until schema is updated.

// ============ Types ============

interface VirtualConfig {
  type: "tarot_readings" | "premium_days" | "expert_discount";
  amount: number;
}

interface PhysicalConfig {
  product_id?: string;
  requires_shipping: boolean;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  type: "virtual" | "physical" | "discount";
  points_cost: number;
  virtual_config: VirtualConfig | null;
  physical_config: PhysicalConfig | null;
  image_url: string | null;
  stock: number | null;
  is_active: boolean;
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

// ============ RewardCard Component ============

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  onRedeem: (reward: Reward) => void;
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, userPoints, onRedeem }) => {
  const canAfford = userPoints >= reward.points_cost;
  const isOutOfStock = reward.stock !== null && reward.stock <= 0;

  const getTypeLabel = () => {
    switch (reward.type) {
      case "virtual":
        return { label: "Virtual", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
      case "physical":
        return { label: "Physical", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      case "discount":
        return { label: "Discount", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    }
  };

  const typeInfo = getTypeLabel();

  return (
    <GlassCard
      className="p-0 overflow-hidden group"
      hoverEffect
      intensity="medium"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-surface to-background overflow-hidden">
        {reward.image_url ? (
          <img
            src={reward.image_url}
            alt={reward.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-primary/30">
              {reward.type === "virtual" ? "auto_awesome" : reward.type === "physical" ? "inventory_2" : "sell"}
            </span>
          </div>
        )}

        {/* Type Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeInfo.color}`}>
          {typeInfo.label}
        </div>

        {/* Stock Badge */}
        {reward.stock !== null && reward.stock <= 10 && reward.stock > 0 && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
            Only {reward.stock} left
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-text-muted font-bold uppercase tracking-wider">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3">
        <h3 className="text-foreground font-bold text-lg">{reward.name}</h3>
        {reward.description && (
          <p className="text-text-muted text-sm line-clamp-2">{reward.description}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">stars</span>
            <span className={`text-xl font-bold ${canAfford ? "text-primary" : "text-text-muted"}`}>
              {reward.points_cost.toLocaleString()}
            </span>
            <span className="text-text-muted text-sm">points</span>
          </div>

          <GlowButton
            variant={canAfford && !isOutOfStock ? "primary" : "secondary"}
            disabled={!canAfford || isOutOfStock}
            onClick={() => onRedeem(reward)}
            className="!px-4 !py-2 !text-xs"
          >
            {isOutOfStock ? "Sold Out" : canAfford ? "Redeem" : "Not Enough"}
          </GlowButton>
        </div>
      </div>
    </GlassCard>
  );
};

// ============ Redemption Modal ============

interface RedemptionModalProps {
  reward: Reward;
  userPoints: number;
  onConfirm: (address?: ShippingAddress) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const RedemptionModal: React.FC<RedemptionModalProps> = ({
  reward,
  userPoints,
  onConfirm,
  onCancel,
  isProcessing,
}) => {
  const [address, setAddress] = useState<ShippingAddress>({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
  });

  const requiresShipping = reward.type === "physical" && reward.physical_config?.requires_shipping;
  const pointsAfter = userPoints - reward.points_cost;

  const isAddressValid = !requiresShipping || (
    address.name.trim() &&
    address.address.trim() &&
    address.city.trim() &&
    address.zip.trim() &&
    address.country.trim()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(requiresShipping ? address : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md bg-surface border border-surface-border rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/10 border-b border-surface-border p-6">
          <h2 className="text-xl font-display font-bold text-foreground text-center">
            Confirm Redemption
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Reward Info */}
          <div className="flex items-start gap-4 p-4 bg-background-alt rounded-xl border border-surface-border">
            {reward.image_url ? (
              <img src={reward.image_url} alt={reward.name} className="w-16 h-16 object-cover rounded-lg" />
            ) : (
              <div className="w-16 h-16 bg-surface rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-primary/50">auto_awesome</span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-foreground">{reward.name}</h3>
              <p className="text-sm text-text-muted">{reward.description}</p>
            </div>
          </div>

          {/* Points Change */}
          <div className="bg-background-alt rounded-xl border border-surface-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Current Points</span>
              <span className="font-bold text-foreground">{userPoints.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-red-400">
              <span>Cost</span>
              <span className="font-bold">-{reward.points_cost.toLocaleString()}</span>
            </div>
            <div className="h-px bg-surface-border" />
            <div className="flex items-center justify-between">
              <span className="text-text-muted">After Redemption</span>
              <span className="font-bold text-primary">{pointsAfter.toLocaleString()}</span>
            </div>
          </div>

          {/* Shipping Address (for physical items) */}
          {requiresShipping && (
            <div className="space-y-4">
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">local_shipping</span>
                Shipping Address
              </h4>
              <div className="grid gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={address.name}
                  onChange={(e) => setAddress(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  required
                />
                <input
                  type="text"
                  placeholder="Street Address"
                  value={address.address}
                  onChange={(e) => setAddress(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                  <input
                    type="text"
                    placeholder="State/Province"
                    value={address.state}
                    onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="ZIP/Postal Code"
                    value={address.zip}
                    onChange={(e) => setAddress(prev => ({ ...prev, zip: e.target.value }))}
                    className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={address.country}
                    onChange={(e) => setAddress(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={address.phone}
                  onChange={(e) => setAddress(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-background border border-surface-border rounded-lg px-4 py-3 text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 bg-surface-border hover:bg-surface-border/80 text-foreground font-medium py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <GlowButton
              type="submit"
              variant="primary"
              disabled={isProcessing || !isAddressValid}
              className="flex-1"
            >
              {isProcessing ? "Processing..." : "Confirm Redemption"}
            </GlowButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ============ Main Rewards Page ============

export const Rewards: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, updateUser } = useUser();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<"all" | "virtual" | "physical" | "discount">("all");

  // Fetch rewards from database
  useEffect(() => {
    async function fetchRewards() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("rewards")
          .select("*")
          .eq("is_active", true)
          .order("points_cost", { ascending: true });

        if (error) throw error;
        setRewards((data as Reward[]) || []);
      } catch (err) {
        console.error("[Rewards] Failed to fetch rewards:", err);
        toast.error("Failed to load rewards");
      } finally {
        setLoading(false);
      }
    }

    fetchRewards();
  }, []);

  // Handle redemption
  const handleRedeem = useCallback(async (address?: ShippingAddress) => {
    if (!selectedReward || !session?.user?.id) return;

    setIsProcessing(true);
    try {
      // 1. Check user has enough points
      if (user.points < selectedReward.points_cost) {
        toast.error("Not enough points");
        return;
      }

      // 2. Check stock (for physical items)
      if (selectedReward.stock !== null && selectedReward.stock <= 0) {
        toast.error("This reward is out of stock");
        return;
      }

      // 3. Deduct points from user
      const newPoints = user.points - selectedReward.points_cost;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ points: newPoints })
        .eq("id", session.user.id);

      if (profileError) throw profileError;

      // 4. Create redemption record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: redemptionError } = await (supabase as any)
        .from("user_rewards")
        .insert({
          user_id: session.user.id,
          reward_id: selectedReward.id,
          status: selectedReward.type === "virtual" ? "fulfilled" : "pending",
          shipping_address: address ? address : null,
        });

      if (redemptionError) throw redemptionError;

      // 5. Update stock if applicable
      if (selectedReward.stock !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("rewards")
          .update({ stock: selectedReward.stock - 1 })
          .eq("id", selectedReward.id);
      }

      // 6. Apply virtual reward immediately
      if (selectedReward.type === "virtual" && selectedReward.virtual_config) {
        const config = selectedReward.virtual_config;
        if (config.type === "tarot_readings") {
          // Add tarot readings - Note: tarot_readings_remaining column needs to be added
          // This feature will work once the database migration is applied
          console.log("[Rewards] Would add tarot readings:", config.amount);
        } else if (config.type === "premium_days") {
          // Add premium days
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: subscription } = await (supabase as any)
            .from("subscriptions")
            .select("*")
            .eq("user_id", session.user.id)
            .single();

          const now = new Date();
          const endDate = subscription?.current_period_end
            ? new Date(subscription.current_period_end)
            : now;

          const newEndDate = new Date(Math.max(endDate.getTime(), now.getTime()));
          newEndDate.setDate(newEndDate.getDate() + config.amount);

          if (subscription) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from("subscriptions")
              .update({
                current_period_end: newEndDate.toISOString(),
                status: "active",
              })
              .eq("id", subscription.id);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from("subscriptions").insert({
              user_id: session.user.id,
              plan: "monthly",
              status: "active",
              current_period_start: now.toISOString(),
              current_period_end: newEndDate.toISOString(),
            });
          }
        }
      }

      // 7. Update local state
      updateUser({ points: newPoints });

      // Refresh rewards to update stock
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("rewards")
        .select("*")
        .eq("is_active", true)
        .order("points_cost", { ascending: true });
      if (data) setRewards(data as Reward[]);

      toast.success(
        selectedReward.type === "virtual"
          ? "Reward redeemed successfully!"
          : "Redemption successful! Your item will be shipped soon."
      );
      setSelectedReward(null);
    } catch (err) {
      console.error("[Rewards] Redemption failed:", err);
      toast.error("Failed to redeem reward. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedReward, session, user.points, updateUser]);

  const filteredRewards = rewards.filter(r => filter === "all" || r.type === filter);

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
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <button
              onClick={() => navigate(PATHS.DASHBOARD)}
              className="text-text-muted hover:text-foreground flex items-center gap-2 text-sm transition-colors group mb-4"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              Back to Dashboard
            </button>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
              Rewards{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">
                Store
              </span>
            </h1>
            <p className="text-text-muted mt-2 max-w-lg">
              Redeem your Spark Points for exclusive rewards, virtual perks, and physical items.
            </p>
          </div>

          {/* Points Balance */}
          <GlassCard className="p-4 md:p-6 flex items-center gap-4" intensity="high">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-primary">stars</span>
            </div>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider">Your Balance</p>
              <p className="text-3xl font-bold text-primary">{user.points.toLocaleString()}</p>
              <p className="text-text-muted text-xs">Spark Points</p>
            </div>
          </GlassCard>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(["all", "virtual", "physical", "discount"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filter === type
                  ? "bg-primary text-background-dark"
                  : "bg-surface-border/30 text-text-muted hover:text-foreground border border-surface-border"
              }`}
            >
              {type === "all" ? "All Rewards" : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Rewards Grid */}
        {filteredRewards.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredRewards.map((reward, idx) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <RewardCard
                  reward={reward}
                  userPoints={user.points}
                  onRedeem={setSelectedReward}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-text-muted/30 mb-4">
              redeem
            </span>
            <h3 className="text-xl font-bold text-foreground mb-2">No Rewards Available</h3>
            <p className="text-text-muted">Check back soon for exciting new rewards!</p>
          </div>
        )}

        {/* How to Earn Points Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6">
            How to Earn Points
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "local_fire_department", title: "Daily Check-in", desc: "Earn 5-200 points per day", points: "+5-200" },
              { icon: "style", title: "Tarot Readings", desc: "Complete daily card readings", points: "+10" },
              { icon: "shopping_bag", title: "Make a Purchase", desc: "Earn 1 point per $1 spent", points: "+1/$1" },
            ].map((item) => (
              <GlassCard key={item.title} className="p-5 flex items-start gap-4" intensity="low">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl text-primary">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-foreground">{item.title}</h4>
                  <p className="text-sm text-text-muted">{item.desc}</p>
                </div>
                <span className="text-primary font-bold text-sm">{item.points}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Redemption Modal */}
      <AnimatePresence>
        {selectedReward && (
          <RedemptionModal
            reward={selectedReward}
            userPoints={user.points}
            onConfirm={handleRedeem}
            onCancel={() => setSelectedReward(null)}
            isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Rewards;
