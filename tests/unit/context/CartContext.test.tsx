import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart, CartItem } from "@/context/CartContext";
import { createMockProduct } from "../../mocks/supabase";

// Test component to access context
function TestConsumer() {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    cartTotal,
    itemCount,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  return (
    <div>
      <span data-testid="item-count">{itemCount}</span>
      <span data-testid="cart-total">{cartTotal}</span>
      <span data-testid="is-open">{isCartOpen.toString()}</span>
      <span data-testid="items">{JSON.stringify(items.map((i) => i.id))}</span>
      <button
        data-testid="add-item"
        onClick={() =>
          addItem({
            id: "prod-1",
            name: "Test Product",
            price: 100,
            description: "Test",
            images: [],
            category: "test",
            tags: [],
          })
        }
      >
        Add Item
      </button>
      <button
        data-testid="add-item-qty"
        onClick={() =>
          addItem(
            {
              id: "prod-2",
              name: "Product 2",
              price: 50,
              description: "Test",
              images: [],
              category: "test",
              tags: [],
            },
            3
          )
        }
      >
        Add Item with Qty
      </button>
      <button data-testid="remove-item" onClick={() => removeItem("prod-1")}>
        Remove Item
      </button>
      <button data-testid="update-qty" onClick={() => updateQuantity("prod-1", 5)}>
        Update Qty
      </button>
      <button data-testid="update-qty-zero" onClick={() => updateQuantity("prod-1", 0)}>
        Update Qty to Zero
      </button>
      <button data-testid="clear-cart" onClick={clearCart}>
        Clear Cart
      </button>
      <button data-testid="toggle-open" onClick={() => setIsCartOpen(!isCartOpen)}>
        Toggle Open
      </button>
    </div>
  );
}

describe("CartContext", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("CartProvider", () => {
    it("should render children", () => {
      render(
        <CartProvider>
          <div data-testid="child">Hello</div>
        </CartProvider>
      );

      expect(screen.getByTestId("child")).toHaveTextContent("Hello");
    });

    it("should initialize with empty cart", () => {
      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      expect(screen.getByTestId("item-count")).toHaveTextContent("0");
      expect(screen.getByTestId("cart-total")).toHaveTextContent("0");
      expect(screen.getByTestId("is-open")).toHaveTextContent("false");
    });

    it("should load cart from localStorage", () => {
      const savedCart: CartItem[] = [
        {
          id: "saved-1",
          name: "Saved Product",
          price: 200,
          quantity: 2,
          description: "Test",
          images: [],
          category: "test",
          tags: [],
        },
      ];
      localStorage.setItem("silk_spark_cart", JSON.stringify(savedCart));

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      expect(screen.getByTestId("item-count")).toHaveTextContent("2");
      expect(screen.getByTestId("cart-total")).toHaveTextContent("400");
      expect(screen.getByTestId("items")).toHaveTextContent('["saved-1"]');
    });

    it("should handle invalid localStorage data gracefully", () => {
      localStorage.setItem("silk_spark_cart", "invalid-json");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      expect(screen.getByTestId("item-count")).toHaveTextContent("0");
      consoleSpy.mockRestore();
    });

    it("should save cart to localStorage on change", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item"));

      const savedCart = JSON.parse(localStorage.getItem("silk_spark_cart") || "[]");
      expect(savedCart).toHaveLength(1);
      expect(savedCart[0].id).toBe("prod-1");
    });
  });

  describe("addItem", () => {
    it("should add new item to cart", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item"));

      expect(screen.getByTestId("item-count")).toHaveTextContent("1");
      expect(screen.getByTestId("cart-total")).toHaveTextContent("100");
    });

    it("should add item with specified quantity", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item-qty"));

      expect(screen.getByTestId("item-count")).toHaveTextContent("3");
      expect(screen.getByTestId("cart-total")).toHaveTextContent("150");
    });

    it("should increment quantity when adding existing item", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item"));
      expect(screen.getByTestId("item-count")).toHaveTextContent("1");

      await user.click(screen.getByTestId("add-item"));
      expect(screen.getByTestId("item-count")).toHaveTextContent("2");
      expect(screen.getByTestId("cart-total")).toHaveTextContent("200");
    });

    it("should open cart when adding item", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      expect(screen.getByTestId("is-open")).toHaveTextContent("false");

      await user.click(screen.getByTestId("add-item"));

      expect(screen.getByTestId("is-open")).toHaveTextContent("true");
    });

    it("should handle multiple different items", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item"));
      await user.click(screen.getByTestId("add-item-qty"));

      expect(screen.getByTestId("item-count")).toHaveTextContent("4"); // 1 + 3
      expect(screen.getByTestId("cart-total")).toHaveTextContent("250"); // 100 + 150
      expect(screen.getByTestId("items")).toHaveTextContent('["prod-1","prod-2"]');
    });
  });

  describe("removeItem", () => {
    it("should remove item from cart", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item"));
      expect(screen.getByTestId("item-count")).toHaveTextContent("1");

      await user.click(screen.getByTestId("remove-item"));
      expect(screen.getByTestId("item-count")).toHaveTextContent("0");
      expect(screen.getByTestId("items")).toHaveTextContent("[]");
    });

    it("should not affect other items when removing one", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item"));
      await user.click(screen.getByTestId("add-item-qty"));
      expect(screen.getByTestId("items")).toHaveTextContent('["prod-1","prod-2"]');

      await user.click(screen.getByTestId("remove-item")); // removes prod-1
      expect(screen.getByTestId("items")).toHaveTextContent('["prod-2"]');
      expect(screen.getByTestId("item-count")).toHaveTextContent("3");
    });

    it("should handle removing non-existent item", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      // Remove item that doesn't exist
      await user.click(screen.getByTestId("remove-item"));

      expect(screen.getByTestId("item-count")).toHaveTextContent("0");
    });
  });

  describe("updateQuantity", () => {
    it("should update item quantity", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item"));
      expect(screen.getByTestId("item-count")).toHaveTextContent("1");

      await user.click(screen.getByTestId("update-qty"));
      expect(screen.getByTestId("item-count")).toHaveTextContent("5");
      expect(screen.getByTestId("cart-total")).toHaveTextContent("500");
    });

    it("should remove item when quantity set to zero", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item"));
      expect(screen.getByTestId("item-count")).toHaveTextContent("1");

      await user.click(screen.getByTestId("update-qty-zero"));
      expect(screen.getByTestId("item-count")).toHaveTextContent("0");
      expect(screen.getByTestId("items")).toHaveTextContent("[]");
    });

    it("should remove item when quantity set to negative", async () => {
      const user = userEvent.setup();

      function NegativeQtyConsumer() {
        const { items, addItem, updateQuantity, itemCount } = useCart();
        return (
          <div>
            <span data-testid="count">{itemCount}</span>
            <button
              onClick={() =>
                addItem({
                  id: "test",
                  name: "Test",
                  price: 10,
                  description: "",
                  images: [],
                  category: "",
                  tags: [],
                })
              }
            >
              Add
            </button>
            <button onClick={() => updateQuantity("test", -5)}>Set Negative</button>
          </div>
        );
      }

      render(
        <CartProvider>
          <NegativeQtyConsumer />
        </CartProvider>
      );

      await user.click(screen.getByText("Add"));
      expect(screen.getByTestId("count")).toHaveTextContent("1");

      await user.click(screen.getByText("Set Negative"));
      expect(screen.getByTestId("count")).toHaveTextContent("0");
    });
  });

  describe("clearCart", () => {
    it("should remove all items from cart", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item"));
      await user.click(screen.getByTestId("add-item-qty"));
      expect(screen.getByTestId("item-count")).toHaveTextContent("4");

      await user.click(screen.getByTestId("clear-cart"));
      expect(screen.getByTestId("item-count")).toHaveTextContent("0");
      expect(screen.getByTestId("cart-total")).toHaveTextContent("0");
      expect(screen.getByTestId("items")).toHaveTextContent("[]");
    });

    it("should update localStorage after clearing", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item"));
      await user.click(screen.getByTestId("clear-cart"));

      const savedCart = JSON.parse(localStorage.getItem("silk_spark_cart") || "[]");
      expect(savedCart).toHaveLength(0);
    });
  });

  describe("cartTotal", () => {
    it("should calculate total correctly with multiple items", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item")); // 100 * 1 = 100
      await user.click(screen.getByTestId("add-item")); // 100 * 2 = 200
      await user.click(screen.getByTestId("add-item-qty")); // 50 * 3 = 150

      expect(screen.getByTestId("cart-total")).toHaveTextContent("350");
    });
  });

  describe("itemCount", () => {
    it("should sum all item quantities", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      await user.click(screen.getByTestId("add-item")); // qty: 1
      await user.click(screen.getByTestId("add-item-qty")); // qty: 3
      await user.click(screen.getByTestId("update-qty")); // prod-1 qty: 5

      expect(screen.getByTestId("item-count")).toHaveTextContent("8"); // 5 + 3
    });
  });

  describe("isCartOpen", () => {
    it("should toggle cart open state", async () => {
      const user = userEvent.setup();

      render(
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      );

      expect(screen.getByTestId("is-open")).toHaveTextContent("false");

      await user.click(screen.getByTestId("toggle-open"));
      expect(screen.getByTestId("is-open")).toHaveTextContent("true");

      await user.click(screen.getByTestId("toggle-open"));
      expect(screen.getByTestId("is-open")).toHaveTextContent("false");
    });
  });

  describe("useCart hook", () => {
    it("should throw error when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow("useCart must be used within a CartProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("memoization", () => {
    it("should maintain referential equality for callbacks", async () => {
      const user = userEvent.setup();
      const addItemRefs: unknown[] = [];

      function RefTracker() {
        const { addItem } = useCart();
        addItemRefs.push(addItem);
        return <button onClick={() => addItem({ id: "x", name: "", price: 0, description: "", images: [], category: "", tags: [] })}>Add</button>;
      }

      const { rerender } = render(
        <CartProvider>
          <RefTracker />
        </CartProvider>
      );

      rerender(
        <CartProvider>
          <RefTracker />
        </CartProvider>
      );

      // useCallback should maintain same reference
      expect(addItemRefs[0]).toBe(addItemRefs[1]);
    });
  });
});
