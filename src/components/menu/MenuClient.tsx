'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useCart } from '@/features/cart/cart-context';
import { formatPrice } from '@/lib/utils';
import type { Category, Product } from '@/types';

interface MenuClientProps {
  categories: Category[];
  products: Product[];
}

export default function MenuClient({ categories, products }: MenuClientProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.slug ?? '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToCategory = (slug: string) => {
    setActiveCategory(slug);
    const element = sectionRefs.current[slug];
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const openProduct = (product: Product) => {
    if (product.sold_out) return;
    setSelectedProduct(product);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addItem({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_price: selectedProduct.price,
      product_image: selectedProduct.image,
      quantity,
      selected_options: [],
      selected_extras: [],
      line_total: selectedProduct.price * quantity,
    });
    setSelectedProduct(null);
  };

  return (
    <div className="w-full pb-24">
      {/* Sticky Categories Tabs */}
      <div className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-neutral-800" style={{ backgroundColor: 'rgba(10,10,10,0.9)' }}>
        <div className="flex overflow-x-auto no-scrollbar py-3 px-4 gap-3 items-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.slug)}
              className="whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-all"
              style={
                activeCategory === cat.slug
                  ? { backgroundColor: 'var(--brand-yellow)', color: 'var(--brand-black)', fontFamily: 'Oswald, sans-serif' }
                  : { backgroundColor: '#1A1A1A', color: '#888', fontFamily: 'Oswald, sans-serif' }
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Sections */}
      <div className="px-4 py-6 max-w-5xl mx-auto flex flex-col gap-10">
        {categories.map((cat) => {
          const catProducts = products.filter(
            (p) => p.category_id === cat.id || p.category?.id === cat.id
          );
          if (catProducts.length === 0) return null;

          return (
            <section
              key={cat.id}
              id={`cat-${cat.slug}`}
              ref={(el) => { sectionRefs.current[cat.slug] = el; }}
              className="scroll-mt-24"
            >
              <h2
                className="text-3xl font-bold mb-5 tracking-wide"
                style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}
              >
                {cat.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex rounded-2xl overflow-hidden border border-neutral-800 cursor-pointer hover:border-neutral-600 transition-all relative"
                    style={{ backgroundColor: '#111111' }}
                    onClick={() => openProduct(product)}
                  >
                    {/* Image */}
                    <div className="w-1/3 min-w-[110px] bg-neutral-800 flex items-center justify-center relative min-h-[120px]">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      ) : (
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-neutral-600"
                        >
                          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                          <line x1="6" y1="1" x2="6" y2="4" />
                          <line x1="10" y1="1" x2="10" y2="4" />
                          <line x1="14" y1="1" x2="14" y2="4" />
                        </svg>
                      )}
                      {product.sold_out && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <span
                            className="text-white font-bold text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: 'var(--brand-red)' }}
                          >
                            AGOTADO
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="w-2/3 p-4 flex flex-col justify-between">
                      <div>
                        <h3
                          className="text-base font-bold leading-tight mb-1"
                          style={{ fontFamily: 'Oswald, sans-serif' }}
                        >
                          {product.name}
                        </h3>
                        <p className="text-neutral-400 text-xs line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                      <div className="flex justify-between items-end mt-3">
                        <span
                          className="text-2xl"
                          style={{ fontFamily: 'Bebas Neue, sans-serif', color: 'var(--brand-yellow)' }}
                        >
                          {formatPrice(product.price)}
                        </span>
                        {!product.sold_out && (
                          <button
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90"
                            style={{ backgroundColor: 'var(--brand-yellow)', color: 'var(--brand-black)' }}
                            onClick={(e) => { e.stopPropagation(); openProduct(product); }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M5 12h14" />
                              <path d="M12 5v14" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Product Modal / Bottom Sheet */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full md:max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh]"
            style={{ backgroundColor: '#111111' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Product image header */}
            <div className="relative h-44 bg-neutral-800 flex items-center justify-center flex-shrink-0">
              {selectedProduct.image ? (
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 448px"
                />
              ) : (
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-700">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
              )}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto flex-1">
              <h2
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                {selectedProduct.name}
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-5">
                {selectedProduct.description}
              </p>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-neutral-800 flex flex-col gap-4 safe-bottom" style={{ backgroundColor: '#0A0A0A' }}>
              {/* Quantity */}
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border border-neutral-700 flex items-center justify-center text-white text-xl font-bold transition-colors hover:border-neutral-500"
                >
                  −
                </button>
                <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-transform active:scale-90"
                  style={{ backgroundColor: 'var(--brand-yellow)', color: 'var(--brand-black)' }}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-between px-5 transition-transform active:scale-98"
                style={{ backgroundColor: 'var(--brand-yellow)', color: 'var(--brand-black)', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}
              >
                <span>AÑADIR AL CARRITO</span>
                <span>{formatPrice(selectedProduct.price * quantity)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
