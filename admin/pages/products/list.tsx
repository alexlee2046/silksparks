import React from "react";
import { useList, useGo, useDelete, useUpdate, Authenticated } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const ProductList: React.FC = () => {
  const { query } = useList({
    resource: "products",
    sorters: [{ field: "featured", order: "desc" }, { field: "created_at", order: "desc" }],
  });
  const { data: products, isLoading } = query;
  const go = useGo();
  const { mutate: deleteProduct } = useDelete();
  const { mutate: updateProduct } = useUpdate();

  const handleToggleFeatured = (id: string, currentFeatured: boolean) => {
    updateProduct(
      { resource: "products", id, values: { featured: !currentFeatured } },
      { onSuccess: () => query.refetch() }
    );
  };

  return (
    <Authenticated key="admin-products-auth" fallback={null}>
      <ProductListContent
        isLoading={isLoading}
        products={products}
        go={go}
        onDelete={(id: string) =>
          deleteProduct(
            { resource: "products", id },
            { onSuccess: () => query.refetch() },
          )
        }
        onToggleFeatured={handleToggleFeatured}
      />
    </Authenticated>
  );
};

const ProductListContent: React.FC<{
  isLoading: boolean;
  products: any;
  go: ReturnType<typeof useGo>;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, currentFeatured: boolean) => void;
}> = ({ isLoading, products, go, onDelete, onToggleFeatured }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted font-display animate-pulse">
          Loading Cosmic Artifacts...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-light text-foreground tracking-tight">
          Products
        </h1>
        <GlowButton
          variant="primary"
          icon="add"
          onClick={() => go({ to: "create" })}
        >
          New Product
        </GlowButton>
      </div>

      <GlassCard className="p-0 border-surface-border overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-surface-border/30 border-b border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Featured</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products?.data.map((product: any) => (
              <tr
                key={product.id}
                className="hover:bg-surface-border/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-8 h-8 rounded-lg object-cover border border-surface-border"
                      />
                    )}
                    <span className="text-sm font-bold text-foreground">
                      {product.title}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-primary font-bold">
                  ${product.price}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full bg-surface-border/30 border border-surface-border text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onToggleFeatured(product.id, product.featured)}
                    className={`p-1.5 rounded-lg transition-all ${
                      product.featured
                        ? "bg-primary/20 text-primary"
                        : "bg-surface-border/30 text-text-muted hover:bg-surface-border/50"
                    }`}
                    title={product.featured ? "Remove from featured" : "Add to featured"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {product.featured ? "star" : "star_outline"}
                    </span>
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        go({
                          to: {
                            resource: "products",
                            action: "edit",
                            id: product.id,
                          },
                        })
                      }
                      className="text-text-muted hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${product.title}"?`)) {
                          onDelete(product.id);
                        }
                      }}
                      className="text-text-muted hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};
