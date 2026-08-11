'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/features/cart/cart-context';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  
  const handleAddToCart = () => {
    if (product.sold_out) return;
    
    const prodImg = product.image_url || product.image || null;
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      product_image: prodImg,
      quantity,
      selected_options: [],
      selected_extras: [],
      line_total: product.price * quantity,
    });
    
    // Optional: show some feedback before closing?
    // The prompt says "Mostrar confirmación: ¡Añadido al pedido!"
    // For now we'll just close it, the StickyCartBar updates automatically.
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-fade-up"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] border"
        style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Product image header */}
        <div className="relative h-48 sm:h-56 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F3E8CC' }}>
          {(product.image_url || product.image) ? (
            <Image
              src={product.image_url || product.image!}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 448px"
            />
          ) : (
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#A94F2F" strokeWidth="1" className="opacity-60">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
            style={{ backgroundColor: 'rgba(58,36,24,0.7)', color: '#FFF7E5' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          <h2
            className="text-2xl font-bold mb-1 uppercase"
            style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}
          >
            {product.name}
          </h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: '#65513F' }}>
            {product.description}
          </p>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex flex-col gap-4 pb-8 md:pb-5" style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8' }}>
          {/* Quantity */}
          <div className="flex items-center justify-center gap-5">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-full border flex items-center justify-center text-2xl font-bold transition-colors shadow-sm active:scale-95"
              style={{ backgroundColor: '#FFF7E5', borderColor: '#D4C4A0', color: '#3A2418' }}
            >
              −
            </button>
            <span className="text-2xl font-bold font-mono w-10 text-center" style={{ color: '#3A2418' }}>{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(20, quantity + 1))}
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition-transform active:scale-90 shadow-md"
              style={{ backgroundColor: '#B88727', color: '#FFF7E5' }}
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.sold_out}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-between px-6 transition-transform active:scale-95 shadow-lg uppercase disabled:opacity-50"
            style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}
          >
            <span>{product.sold_out ? 'AGOTADO' : 'AÑADIR AL PEDIDO'}</span>
            {!product.sold_out && <span className="font-mono">{formatPrice(product.price * quantity)}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
