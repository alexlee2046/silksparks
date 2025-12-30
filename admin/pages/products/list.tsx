import React from "react";
import { useList, useGo, useDelete, Authenticated } from "@refinedev/core";
import { GlassCard } from "../../../components/GlassCard";
import { GlowButton } from "../../../components/GlowButton";

export const ProductList: React.FC = () => {
  const { query } = useList({
    resource: "products",
  });
  const { data: products, isLoading } = query;
  const go = useGo();
  const { mutate: deleteProduct } = useDelete();

  return (
    <Authenticated key="admin-products-auth" fallback={null}>
      <ProductListContent
        isLoading={isLoading}
        products={products}
        go={go}
        onDelete={(id: string) =>
          deleteProduct(
            { resource: "products", id },
            { onSuccess: () => query.refetch() }
          )
        }
      />
    </Authenticated>
  );
};

const ProductListContent: React.FC<{
  isLoading: boolean;
  products: any;
  go: ReturnType<typeof useGo>;
  onDelete: (id: string) => void;
}> = ({ isLoading, products, go, onDelete }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/40 font-display animate-pulse">
          Loading Cosmic Artifacts...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-light text-white tracking-tight">
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

      <GlassCard className="p-0 border-white/5 overflow-hidden" intensity="low">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products?.data.map((product: any) => (
              <tr
                key={product.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-8 h-8 rounded-lg object-cover border border-white/10"
                      />
                    )}
                    <span className="text-sm font-bold text-white">
                      {product.title}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-primary font-bold">
                  ${product.price}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 uppercase tracking-wider">
                    {product.category}
                  </span>
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
                      className="text-white/20 hover:text-white transition-colors"
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
                      className="text-white/20 hover:text-rose-400 transition-colors"
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
