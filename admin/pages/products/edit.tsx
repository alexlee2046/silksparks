import React, { useEffect } from "react";
import { useForm } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const ProductEdit: React.FC = () => {
  const {
    onFinish,
    mutation,
    query: queryResult,
    formLoading,
  } = useForm({
    action: "edit",
    resource: "products",
    redirect: "list",
  });

  const product = queryResult?.data?.data;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onFinish(data);
  };

  if (formLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 font-display animate-pulse">
          Loading Artifact Details...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-light text-white tracking-tight">
        Edit Product
      </h1>

      <GlassCard className="p-8 border-white/5" intensity="low">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Title
              </label>
              <input
                name="title"
                defaultValue={product?.title}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Price
              </label>
              <input
                name="price"
                type="number"
                step="0.01"
                defaultValue={product?.price}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Category
              </label>
              <select
                name="category"
                defaultValue={product?.category}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors appearance-none"
              >
                <option value="Crystals">Crystals</option>
                <option value="Tarot">Tarot</option>
                <option value="Cleansing">Cleansing</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Candles">Candles</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Element
              </label>
              <select
                name="element"
                defaultValue={product?.element}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors appearance-none"
              >
                <option value="Spirit">Spirit</option>
                <option value="Fire">Fire</option>
                <option value="Air">Air</option>
                <option value="Water">Water</option>
                <option value="Earth">Earth</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={product?.description}
              rows={4}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Image URL
            </label>
            <input
              name="image_url"
              defaultValue={product?.image_url}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <GlowButton
              variant="secondary"
              type="button"
              onClick={() => window.history.back()}
            >
              Cancel
            </GlowButton>
            <GlowButton
              variant="primary"
              type="submit"
              disabled={mutation?.isPending}
            >
              {mutation?.isPending ? "Saving..." : "Save Changes"}
            </GlowButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
