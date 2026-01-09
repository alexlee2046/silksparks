import React from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../../components/GlassCard";
import { GlowButton } from "../../components/GlowButton";
import { supabase } from "../../services/supabase";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import type { ShippingZoneWithRates } from "../../types/database";
import { AdminLayout } from "./AdminLayout";
import { ShippingZone } from "./ShippingZone";

export const Shipping: React.FC = () => {
  const navigate = useNavigate();

  const { data: zones, loading, refetch } = useSupabaseQuery<ShippingZoneWithRates>({
    table: "shipping_zones",
    select: "*, shipping_rates(*)",
  });

  const handleAddZone = async () => {
    const { error } = await supabase
      .from("shipping_zones")
      .insert({ name: "New Zone", countries: [] });

    if (error) {
      console.error("[Admin] Failed to create shipping zone:", error.message);
      return;
    }

    // Refetch to get updated data including the new zone
    await refetch();
  };

  return (
    <AdminLayout title="Shipping Rate Templates" navigate={navigate}>
      <div className="grid grid-cols-1 gap-8">
        <GlassCard className="overflow-hidden border-surface-border p-0">
          <div className="p-8 border-b border-surface-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground font-display">
                Global Shipping Profile
              </h2>
              <p className="text-sm text-text-muted font-light flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">
                  inventory_2
                </span>{" "}
                {zones.length * 10} products active •{" "}
                <span className="material-symbols-outlined text-sm">
                  public
                </span>{" "}
                {zones.length} shipping zones
              </p>
            </div>
            <GlowButton
              variant="secondary"
              className="h-10 text-xs"
              icon="add"
              onClick={handleAddZone}
            >
              New Profile
            </GlowButton>
          </div>
          <div className="p-8 space-y-8">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">
                public
              </span>{" "}
              Configured Zones
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {loading ? (
                <div className="p-10 text-center text-text-muted text-xs tracking-widest uppercase">
                  Calculating cosmic distances...
                </div>
              ) : (
                zones.map((zone) => (
                  <ShippingZone
                    key={zone.id}
                    name={zone.name}
                    rates={
                      zone.shipping_rates?.map((r) => ({
                        name: r.name,
                        price: `$${r.price.toFixed(2)}`,
                      })) || []
                    }
                  />
                ))
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </AdminLayout>
  );
};
