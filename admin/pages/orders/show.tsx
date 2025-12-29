import React from "react";
import { useShow, useUpdate } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const OrderShow: React.FC = () => {
  const { query: queryResult } = useShow({
    resource: "orders",
    meta: {
      select: "*, profiles(email), order_items(*, products(title, image_url))",
    },
  });
  const { mutate: update, mutation } = useUpdate();
  const isUpdating = mutation?.isPending;
  const { data, isLoading } = queryResult;
  const order = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 font-display animate-pulse">
          Loading Order Details...
        </div>
      </div>
    );
  }

  const handleStatusUpdate = (status: string) => {
    update({
      resource: "orders",
      id: order.id,
      values: { status },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="text-white/40 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-3xl font-display font-light text-white tracking-tight">
            Order #{order?.id?.toString().slice(0, 8)}
          </h1>
        </div>
        <div className="flex gap-2">
          {order?.status === "pending" && (
            <>
              <GlowButton
                variant="primary"
                onClick={() => handleStatusUpdate("completed")}
                disabled={isUpdating}
              >
                Mark Completed
              </GlowButton>
              <button
                onClick={() => handleStatusUpdate("cancelled")}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-sm font-bold transition-colors"
              >
                Cancel Order
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <GlassCard className="p-6 border-white/5" intensity="low">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">
              Order Items
            </h3>
            <div className="space-y-4">
              {order?.order_items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="w-16 h-16 rounded-lg bg-black/40 border border-white/10 overflow-hidden">
                    {item.products?.image_url && (
                      <img
                        src={item.products.image_url}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white">
                      {item.products?.title || "Unknown Product"}
                    </div>
                    <div className="text-xs text-white/40">
                      Qty: {item.quantity} × ${item.price_at_purchase}
                    </div>
                  </div>
                  <div className="text-lg font-mono text-primary font-bold">
                    ${(item.quantity * item.price_at_purchase).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-end">
              <div className="text-xs text-white/40">Total Amount</div>
              <div className="text-3xl font-mono text-primary font-bold">
                ${order?.total_amount}
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6 border-white/5" intensity="low">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">
              Customer
            </h3>
            <div className="space-y-1">
              <div className="text-white font-bold">
                {order?.profiles?.email}
              </div>
              <div className="text-xs text-white/40">ID: {order?.user_id}</div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-white/5" intensity="low">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">
              Details
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-white/40 mb-1">Status</div>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white uppercase tracking-wider">
                  {order?.status}
                </span>
              </div>
              <div>
                <div className="text-xs text-white/40 mb-1">Date</div>
                <div className="text-white text-sm">
                  {new Date(order?.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
