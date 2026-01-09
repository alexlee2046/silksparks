import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Product } from "../services/RecommendationEngine";
import toast from "react-hot-toast";

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("silk_spark_cart");
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          // 验证数据结构是否有效
          if (Array.isArray(parsed) && parsed.every(item =>
            item && typeof item.id === "string" && typeof item.quantity === "number"
          )) {
            return parsed;
          }
          // 数据格式无效，清除并通知用户
          console.warn("[Cart] Invalid cart data structure, resetting cart");
          localStorage.removeItem("silk_spark_cart");
        } catch (e) {
          // JSON 解析失败，清除损坏的数据
          console.error("[Cart] Failed to parse cart data, resetting cart", e);
          localStorage.removeItem("silk_spark_cart");
          // 延迟显示 toast，避免在初始化时触发
          setTimeout(() => {
            toast.error("购物车数据已重置，请重新添加商品");
          }, 100);
        }
      }
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem("silk_spark_cart", JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const cartTotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      cartTotal,
      itemCount,
      isCartOpen,
      setIsCartOpen,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, cartTotal, itemCount, isCartOpen]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
