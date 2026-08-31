'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { CartItem } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'cart_item_id'>) => boolean;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateNote: (cartItemId: string, note: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  userId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const isInitializedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const supabase = createClient();

  // Helper to load cart for a specific user ID
  const loadUserCart = useCallback((uid: string | null) => {
    currentUserIdRef.current = uid;
    if (typeof window === 'undefined') return;

    // Remove legacy unauthenticated cart key to prevent cross-contamination
    try {
      localStorage.removeItem('esquina51_cart');
    } catch {}

    if (!uid) {
      setItems([]);
      return;
    }

    try {
      const stored = localStorage.getItem(`esquina51_cart_${uid}`);
      setItems(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error('Failed to parse user cart from localStorage', e);
      setItems([]);
    }
  }, []);

  // Listen to Supabase auth state and initialize
  useEffect(() => {
    let mounted = true;

    // 1. Initial auth check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      const uid = user ? user.id : null;
      setUserId(uid);
      loadUserCart(uid);
      isInitializedRef.current = true;
    });

    // 2. Auth state subscription (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      const newUid = session?.user?.id ?? null;
      setUserId(newUid);
      loadUserCart(newUid);
      isInitializedRef.current = true;
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadUserCart]);

  // Persist items to localStorage for the active user
  useEffect(() => {
    if (!isInitializedRef.current || typeof window === 'undefined') return;
    
    const uid = currentUserIdRef.current;
    if (uid) {
      try {
        localStorage.setItem(`esquina51_cart_${uid}`, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart to localStorage', e);
      }
    }
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'cart_item_id'>): boolean => {
    // Only allow adding items if user is authenticated
    if (!currentUserIdRef.current) {
      return false;
    }

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => {
        if (item.product_id !== newItem.product_id) return false;
        const sameOptions =
          JSON.stringify(item.selected_options ?? []) ===
          JSON.stringify(newItem.selected_options ?? []);
        const sameExtras =
          JSON.stringify(item.selected_extras ?? []) ===
          JSON.stringify(newItem.selected_extras ?? []);
        const sameNote = item.note === newItem.note;
        return sameOptions && sameExtras && sameNote;
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

    return true;
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

  const updateNote = (cartItemId: string, note: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.cart_item_id === cartItemId ? { ...item, note } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    const uid = currentUserIdRef.current;
    if (uid && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`esquina51_cart_${uid}`);
      } catch {}
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateNote,
        clearCart,
        totalItems,
        subtotal,
        userId,
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
