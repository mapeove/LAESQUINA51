'use client';

import { useState, useEffect } from 'react';
import { X, Flame, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/features/cart/cart-context';
import type { Promotion, Product } from '@/types';
import { formatPrice } from '@/lib/utils';

interface PromoModalProps {
  promotion?: Promotion | null;
  product?: Product | null;
}

export function PromoModal({ promotion, product }: PromoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    // Show once per session using sessionStorage
    const hasSeenModal = sessionStorage.getItem('esquina51_promo_seen');
    if (!hasSeenModal) {
      // Delay slightly for smooth entrance
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('esquina51_promo_seen', 'true');
    setIsOpen(false);
  };

  const handleAddToCart = () => {
    if (product) {
      addItem({
        product_id: product.id,
        product_name: product.name,
        product_price: promotion?.promo_price ?? product.price,
        product_image: product.image,
        quantity: 1,
        selected_options: [],
        selected_extras: [],
        line_total: promotion?.promo_price ?? product.price,
      });
    }
    handleClose();
  };

  if (!isOpen) return null;

  const title = promotion?.title || '🔥 EL BOX QUE ESTÁ ROMPIENDO LA ESQUINA';
  const subtitle = promotion?.subtitle || '5 MINI BURGERS + PATATAS + SALSAS + COCA-COLA';
  const price = promotion?.promo_price || 10.50;
  const image = promotion?.image_url || product?.image || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-up">
      <div 
        className="relative w-full max-w-lg rounded-3xl overflow-hidden border border-yellow-500/40 shadow-2xl"
        style={{ backgroundColor: '#111111' }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-neutral-300 hover:text-white hover:bg-black transition-colors border border-neutral-700"
          aria-label="Cerrar ventana promocional"
        >
          <X size={20} />
        </button>

        {/* Promo Header Image / Placeholder */}
        <div className="relative w-full h-56 md:h-64 bg-neutral-900 flex items-center justify-center overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 500px"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex flex-col items-center justify-center p-6 text-center">
              <Flame className="w-16 h-16 text-yellow-500 mb-2 animate-bounce" />
              <span className="font-mono text-xs uppercase tracking-widest text-yellow-400 font-bold">
                OFERTA ESTRELLA LA ESQUINA 51
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Flame size={14} /> PROMOCIÓN DESTACADA
          </div>

          <h2 
            className="text-2xl md:text-3xl font-bold leading-tight uppercase tracking-wide"
            style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}
          >
            {title}
          </h2>

          <p className="text-xs md:text-sm text-neutral-300 max-w-sm mx-auto font-medium">
            {subtitle}
          </p>

          <div className="pt-2">
            <span className="text-xs text-neutral-400 uppercase tracking-widest block font-mono">Precio Especial</span>
            <span 
              className="text-4xl md:text-5xl font-bold tracking-tight font-mono text-yellow-500"
            >
              {formatPrice(price)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            {product ? (
              <button
                onClick={handleAddToCart}
                className="py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-yellow-500 text-black hover:bg-yellow-400 transition-transform active:scale-95 shadow-lg"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                <ShoppingBag size={16} /> PEDIR AHORA
              </button>
            ) : (
              <Link
                href="/menu"
                onClick={handleClose}
                className="py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-yellow-500 text-black hover:bg-yellow-400 transition-transform active:scale-95 shadow-lg"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                <ShoppingBag size={16} /> PEDIR AHORA
              </Link>
            )}

            <Link
              href="/menu"
              onClick={handleClose}
              className="py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-neutral-700 transition-all"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              VER MENÚ <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
