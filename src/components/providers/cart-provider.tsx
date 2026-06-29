"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type CartItem =
  | {
      id: string;
      type: "product";
      title: string;
      variantId: string;
      quantity: number;
      unitKobo: number;
      image?: string;
      metadata?: Record<string, string>;
    }
  | {
      id: string;
      type: "ticket";
      title: string;
      eventId: string;
      ticketTierId: string;
      quantity: number;
      unitKobo: number;
      image?: string;
      metadata?: Record<string, string>;
    }
  | {
      id: string;
      type: "addon";
      title: string;
      eventId: string;
      eventAddOnId: string;
      quantity: number;
      unitKobo: number;
      image?: string;
      metadata?: Record<string, string>;
    };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalKobo: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const storageKey = "popsy-adonis-cart";
const cartChangeEvent = "popsy-adonis-cart-change";
const emptyCart: CartItem[] = [];
let lastCartRaw: string | null = null;
let lastCartSnapshot: CartItem[] = emptyCart;

function getServerCartSnapshot() {
  return emptyCart;
}

function readCartSnapshot() {
  if (typeof window === "undefined") return emptyCart;

  const storedCart = window.localStorage.getItem(storageKey);
  if (!storedCart) {
    lastCartRaw = null;
    lastCartSnapshot = emptyCart;
    return lastCartSnapshot;
  }

  if (storedCart === lastCartRaw) {
    return lastCartSnapshot;
  }

  try {
    lastCartRaw = storedCart;
    lastCartSnapshot = JSON.parse(storedCart) as CartItem[];
    return lastCartSnapshot;
  } catch {
    lastCartRaw = storedCart;
    lastCartSnapshot = emptyCart;
    return lastCartSnapshot;
  }
}

function writeCartSnapshot(items: CartItem[]) {
  const nextRaw = JSON.stringify(items);
  lastCartRaw = nextRaw;
  lastCartSnapshot = items;
  window.localStorage.setItem(storageKey, nextRaw);
  window.dispatchEvent(new Event(cartChangeEvent));
}

function subscribeToCart(callback: () => void) {
  window.addEventListener(cartChangeEvent, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(cartChangeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribeToCart, readCartSnapshot, getServerCartSnapshot);

  const addItem = useCallback((item: CartItem) => {
    const currentItems = readCartSnapshot();
    const existingItem = currentItems.find((currentItem) => currentItem.id === item.id);

    if (!existingItem) {
      writeCartSnapshot([...currentItems, item]);
      return;
    }

    writeCartSnapshot(
      currentItems.map((currentItem) => {
        if (currentItem.id !== item.id) return currentItem;

        const maxQuantity = item.type === "ticket" && item.metadata?.promo ? 1 : 20;

        return { ...currentItem, quantity: Math.min(currentItem.quantity + item.quantity, maxQuantity) };
      }),
    );
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    writeCartSnapshot(
      readCartSnapshot()
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, 20)) } : item))
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    writeCartSnapshot(readCartSnapshot().filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => writeCartSnapshot([]), []);

  const value = useMemo(() => {
    const subtotalKobo = items.reduce((sum, item) => sum + item.unitKobo * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      itemCount,
      subtotalKobo,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [addItem, clearCart, items, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
