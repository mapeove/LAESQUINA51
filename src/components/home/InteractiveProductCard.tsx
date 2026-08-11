'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ProductModal } from '@/components/menu/ProductModal';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

interface InteractiveProductCardProps {
  product: Product;
  variant?: 'featured' | 'collage';
}

export function InteractiveProductCard({ product, variant = 'featured' }: InteractiveProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const prodImg = product.image_url || product.image || '/images/products/la-casi-triple.jpg';

  if (variant === 'collage') {
    return (
      <>
        <div 
          onClick={() => setIsModalOpen(true)}
          className="relative h-44 sm:h-56 md:h-64 rounded-2xl overflow-hidden shadow-md group cursor-pointer" 
          style={{ border: '2px solid #E8D5A8', backgroundColor: '#FFF7E5' }}
        >
          <Image
            src={prodImg}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3A2418]/80 via-transparent to-transparent flex items-end p-3">
            <span className="font-bold text-xs font-mono text-[#FFF7E5]">{product.name} · {formatPrice(product.price)}</span>
          </div>
          {product.sold_out && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold font-mono uppercase rounded-full">
                AGOTADO
              </span>
            </div>
          )}
        </div>
        {isModalOpen && (
          <ProductModal product={product} onClose={() => setIsModalOpen(false)} />
        )}
      </>
    );
  }

  // default 'featured'
  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="rounded-3xl border overflow-hidden flex flex-col justify-between shadow-sm group cursor-pointer hover:shadow-md transition-shadow" 
        style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}
      >
        <div className="relative w-full h-48 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#F3E8CC' }}>
          <Image
            src={prodImg}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 300px"
          />
          {product.sold_out && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold font-mono uppercase rounded-full">
                AGOTADO
              </span>
            </div>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
              {product.name}
            </h3>
            <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: '#65513F' }}>
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#E8D5A8' }}>
            <span className="text-2xl font-bold font-mono" style={{ color: '#A94F2F' }}>{formatPrice(product.price)}</span>
            <button
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-transform active:scale-95"
              style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
            >
              AÑADIR
            </button>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <ProductModal product={product} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
