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
    const prodImg = selectedProduct.image_url || selectedProduct.image || null;
    addItem({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_price: selectedProduct.price,
      product_image: prodImg,
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
      <div className="sticky top-16 z-40 w-full backdrop-blur-md border-b shadow-sm" style={{ backgroundColor: 'rgba(255, 247, 229, 0.95)', borderColor: '#E8D5A8' }}>
        <div className="flex overflow-x-auto no-scrollbar py-3 px-4 gap-2 items-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.slug)}
              className="whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all border shadow-sm"
              style={
                activeCategory === cat.slug
                  ? { backgroundColor: '#B88727', color: '#FFF7E5', borderColor: '#B88727', fontFamily: 'Oswald, sans-serif' }
                  : { backgroundColor: '#F3E8CC', color: '#65513F', borderColor: '#D4C4A0', fontFamily: 'Oswald, sans-serif' }
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
                className="text-3xl font-bold mb-5 tracking-wide uppercase border-b pb-2"
                style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418', borderColor: '#E8D5A8' }}
              >
                {cat.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catProducts.map((product) => {
                  const prodImg = product.image_url || product.image;
                  return (
                    <div
                      key={product.id}
                      className="flex rounded-2xl overflow-hidden border cursor-pointer hover:border-[#B88727] transition-all relative shadow-sm group"
                      style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}
                      onClick={() => openProduct(product)}
                    >
                      {/* Image */}
                      <div className="w-1/3 min-w-[110px] flex items-center justify-center relative min-h-[120px]" style={{ backgroundColor: '#F3E8CC' }}>
                        {prodImg ? (
                          <Image
                            src={prodImg}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="140px"
                          />
                        ) : (
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#A94F2F"
                            strokeWidth="1.5"
                            className="opacity-70"
                          >
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                            <line x1="6" y1="1" x2="6" y2="4" />
                            <line x1="10" y1="1" x2="10" y2="4" />
                            <line x1="14" y1="1" x2="14" y2="4" />
                          </svg>
                        )}
                        {product.sold_out && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span
                              className="text-white font-bold text-xs px-2 py-1 rounded-full font-mono"
                              style={{ backgroundColor: '#A94F2F' }}
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
                            className="text-base font-bold leading-tight mb-1 uppercase"
                            style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}
                          >
                            {product.name}
                          </h3>
                          <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: '#65513F' }}>
                            {product.description}
                          </p>
                        </div>
                        <div className="flex justify-between items-end mt-3">
                          <span
                            className="text-2xl font-bold font-mono"
                            style={{ color: '#A94F2F' }}
                          >
                            {formatPrice(product.price)}
                          </span>
                          {!product.sold_out && (
                            <button
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 shadow-sm"
                              style={{ backgroundColor: '#B88727', color: '#FFF7E5' }}
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
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Product Modal / Bottom Sheet */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-fade-up"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full md:max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] border"
            style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Product image header */}
            <div className="relative h-48 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F3E8CC' }}>
              {(selectedProduct.image_url || selectedProduct.image) ? (
                <Image
                  src={selectedProduct.image_url || selectedProduct.image!}
                  alt={selectedProduct.name}
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
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow"
                style={{ backgroundColor: 'rgba(58,36,24,0.7)', color: '#FFF7E5' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                {selectedProduct.name}
              </h2>
              <p className="text-sm leading-relaxed mb-5" style={{ color: '#65513F' }}>
                {selectedProduct.description}
              </p>
            </div>

            {/* Footer */}
            <div className="p-5 border-t flex flex-col gap-4 safe-bottom" style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8' }}>
              {/* Quantity */}
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border flex items-center justify-center text-xl font-bold transition-colors"
                  style={{ backgroundColor: '#FFF7E5', borderColor: '#D4C4A0', color: '#3A2418' }}
                >
                  −
                </button>
                <span className="text-xl font-bold font-mono w-8 text-center" style={{ color: '#3A2418' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-transform active:scale-90 shadow-sm"
                  style={{ backgroundColor: '#B88727', color: '#FFF7E5' }}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-between px-5 transition-transform active:scale-98 shadow-md uppercase"
                style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}
              >
                <span>AÑADIR AL CARRITO</span>
                <span className="font-mono">{formatPrice(selectedProduct.price * quantity)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
