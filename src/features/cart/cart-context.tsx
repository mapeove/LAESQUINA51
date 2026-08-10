'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'cart_item_id'>) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('esquina51_cart');
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error('Failed to parse cart from localStorage', e);
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('esquina51_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'cart_item_id'>) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => {
        if (item.product_id !== newItem.product_id) return false;
        const sameOptions =
          JSON.stringify(item.selected_options ?? []) ===
          JSON.stringify(newItem.selected_options ?? []);
        const sameExtras =
          JSON.stringify(item.selected_extras ?? []) ===
          JSON.stringify(newItem.selected_extras ?? []);
        return sameOptions && sameExtras;
      });

      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + newItem.quantity;
        const unitPrice =
          newItem.product_price +
          (newItem.selected_options ?? []).reduce(
            (s, o) => s + o.price_modifier,
            0
          ) +
          (newItem.selected_extras ?? []).reduce((s, e) => s + e.price, 0);
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          line_total: unitPrice * newQty,
        };
        return updated;
      }

      const cart_item_id = crypto.randomUUID();
      return [
        ...prev,
        {
          ...newItem,
          cart_item_id,
        },
      ];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cart_item_id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.cart_item_id !== cartItemId) return item;
        const unitPrice =
          item.product_price +
          (item.selected_options ?? []).reduce(
            (s, o) => s + o.price_modifier,
            0
          ) +
          (item.selected_extras ?? []).reduce((s, e) => s + e.price, 0);
        return { ...item, quantity, line_total: unitPrice * quantity };
      })
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = items.reduce((acc, item) => acc + item.line_total, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
