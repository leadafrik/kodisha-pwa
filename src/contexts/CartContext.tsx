import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CartItem } from "../types/orders";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  setItemQuantity: (listingId: string, quantity: number) => void;
  removeItem: (listingId: string) => void;
  clearCart: () => void;
  getItemQuantity: (listingId: string) => number;
}

const CART_STORAGE_KEY = "agrisoko_marketplace_cart_v1";

const CartContext = createContext<CartContextValue | undefined>(undefined);

const clampQuantity = (quantity: number, maxQuantity?: number) => {
  const normalized = Number.isFinite(quantity) ? quantity : 1;
  const positive = Math.max(0.01, normalized);
  if (typeof maxQuantity === "number" && maxQuantity > 0) {
    return Math.min(positive, maxQuantity);
  }
  return positive;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setItems(parsed);
      }
    } catch {
      // Ignore malformed cart data.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors.
    }
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.listingId === item.listingId);
      if (!existing) {
        return [
          ...current,
          {
            ...item,
            quantity: clampQuantity(item.quantity, item.maxQuantity),
          },
        ];
      }

      return current.map((entry) =>
        entry.listingId === item.listingId
          ? {
              ...entry,
              ...item,
              quantity: clampQuantity(entry.quantity + item.quantity, item.maxQuantity ?? entry.maxQuantity),
            }
          : entry
      );
    });
  }, []);

  const setItemQuantity = useCallback((listingId: string, quantity: number) => {
    setItems((current) =>
      current
        .map((entry) =>
          entry.listingId === listingId
            ? {
                ...entry,
                quantity: clampQuantity(quantity, entry.maxQuantity),
              }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((listingId: string) => {
    setItems((current) => current.filter((entry) => entry.listingId !== listingId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemQuantity = useCallback(
    (listingId: string) => items.find((entry) => entry.listingId === listingId)?.quantity || 0,
    [items]
  );

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.length;

    return {
      items,
      itemCount,
      subtotal,
      addItem,
      setItemQuantity,
      removeItem,
      clearCart,
      getItemQuantity,
    };
  }, [items, addItem, setItemQuantity, removeItem, clearCart, getItemQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
