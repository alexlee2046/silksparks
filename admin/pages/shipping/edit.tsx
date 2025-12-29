import React, { useState } from "react";
import {
  useForm,
  useList,
  useCreate,
  useDelete,
  useUpdate,
} from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const ShippingEdit: React.FC = () => {
  // 1. Zone Form
  // 1. Zone Form
  const {
    onFinish,
    mutation,
    query: queryResult,
    formLoading,
    id: zoneId,
  } = useForm({
    action: "edit",
    resource: "shipping_zones",
    redirect: false, // Stay on page to manage rates
  });

  const zone = queryResult?.data?.data;

  // 2. Fetch Rates for this Zone
  // 2. Fetch Rates for this Zone
  const { query: ratesQuery } = useList({
    resource: "shipping_rates",
    filters: [
      {
        field: "zone_id",
        operator: "eq",
        value: zoneId,
      },
    ],
  });
  const { data: ratesData, isLoading: ratesLoading, refetch: refetchRates } = ratesQuery;

  // 3. Rate Mutations
  const { mutate: createRate } = useCreate();
  const { mutate: deleteRate } = useDelete();

  const [newRate, setNewRate] = useState({
    name: "",
    price: "",
    description: "",
  });

  const onSubmitZone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onFinish(data);
  };

  const handleAddRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneId) return;

    createRate(
      {
        resource: "shipping_rates",
        values: {
          ...newRate,
          zone_id: zoneId,
          price: parseFloat(newRate.price), // ensure number
        },
      },
      {
        onSuccess: () => {
          setNewRate({ name: "", price: "", description: "" });
          // Refine usually auto-refetches, but just in case
        },
      },
    );
  };

  if (formLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 font-display animate-pulse">
          Loading Configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="text-white/50 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-3xl font-display font-light text-white tracking-tight">
          Edit Zone:{" "}
          <span className="font-bold text-primary">{zone?.name}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Zone Settings */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6 border-white/5 space-y-6" intensity="low">
            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4">
              Zone Details
            </h3>
            <form onSubmit={onSubmitZone} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                  Zone Name
                </label>
                <input
                  name="name"
                  defaultValue={zone?.name}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                  Region
                </label>
                <input
                  name="region"
                  defaultValue={zone?.region}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors"
                />
              </div>

              <GlowButton
                variant="primary"
                type="submit"
                className="w-full"
                disabled={mutation?.isPending}
              >
                {mutation?.isPending ? "Saving..." : "Update Zone"}
              </GlowButton>
            </form>
          </GlassCard>
        </div>

        {/* Right: Rates Management */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard
            className="p-0 overflow-hidden border-white/5"
            intensity="low"
          >
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Shipping Rates</h3>
            </div>

            {/* List Existing Rates */}
            <div className="divide-y divide-white/5">
              {ratesLoading ? (
                <div className="p-8 text-center text-white/40">
                  Loading rates...
                </div>
              ) : ratesData?.data.length === 0 ? (
                <div className="p-8 text-center text-white/40">
                  No rates configured for this zone yet.
                </div>
              ) : (
                ratesData?.data.map((rate: any) => (
                  <div
                    key={rate.id}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{rate.name}</span>
                      <span className="text-xs text-text-muted">
                        {rate.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-mono text-primary font-bold">
                        ${Number(rate.price).toFixed(2)}
                      </span>
                      <button
                        onClick={() =>
                          deleteRate({
                            resource: "shipping_rates",
                            id: rate.id,
                          })
                        }
                        className="text-white/20 hover:text-red-400 transition-colors p-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Rate Form */}
            <div className="p-6 bg-black/20 border-t border-white/5">
              <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4">
                Add New Rate
              </h4>
              <form onSubmit={handleAddRate} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    placeholder="Rate Name (e.g. Standard)"
                    value={newRate.name}
                    onChange={(e) =>
                      setNewRate({ ...newRate, name: e.target.value })
                    }
                    required
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary/50 outline-none"
                  />
                  <input
                    placeholder="Price (e.g. 5.99)"
                    type="number"
                    step="0.01"
                    value={newRate.price}
                    onChange={(e) =>
                      setNewRate({ ...newRate, price: e.target.value })
                    }
                    required
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary/50 outline-none"
                  />
                </div>
                <input
                  placeholder="Description (e.g. 3-5 Business Days)"
                  value={newRate.description}
                  onChange={(e) =>
                    setNewRate({ ...newRate, description: e.target.value })
                  }
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary/50 outline-none"
                />
                <GlowButton
                  variant="secondary"
                  type="submit"
                  icon="add"
                  className="w-full sm:w-auto self-end"
                >
                  Add Rate
                </GlowButton>
              </form>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
