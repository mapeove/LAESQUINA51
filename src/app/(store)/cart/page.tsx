'use client';

import { useCart } from '@/features/cart/cart-context';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fade-up">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm" style={{ backgroundColor: 'rgba(184,135,39,0.15)', color: '#B88727' }}>
          <svg
            className="w-10 h-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <h2
          className="text-3xl font-bold mb-2 uppercase"
          style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}
        >
          Tu carrito está vacío
        </h2>
        <p className="mb-8 max-w-xs text-xs font-mono" style={{ color: '#65513F' }}>
          ¿Aún no has decidido qué pedir? Échale un vistazo a nuestro menú.
        </p>
        <Link
          href="/menu"
          className="px-8 py-4 rounded-2xl font-bold uppercase transition-transform active:scale-95 shadow-md text-xs tracking-wider"
          style={{
            backgroundColor: '#B88727',
            color: '#FFF7E5',
            fontFamily: 'Oswald, sans-serif',
          }}
        >
          VER MENÚ
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto w-full animate-fade-up min-h-screen" style={{ backgroundColor: '#F3E8CC' }}>
      <h1
        className="text-4xl font-bold tracking-wide mb-6 uppercase"
        style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}
      >
        TU CARRITO
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items List */}
        <div className="flex-1 flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.cart_item_id}
              className="flex gap-3 p-4 rounded-2xl border shadow-sm"
              style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}
            >
              {/* Image */}
              {item.product_image ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border" style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8' }}>
                  <Image
                    src={item.product_image}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0 border" style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A94F2F" strokeWidth="1.5" className="opacity-60">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  </svg>
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3
                    className="font-bold text-base leading-tight truncate uppercase"
                    style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}
                  >
                    {item.product_name}
                  </h3>
                  <button
                    onClick={() => removeItem(item.cart_item_id)}
                    className="p-1.5 rounded-full transition-colors"
                    style={{ color: '#A94F2F' }}
                    aria-label="Eliminar"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>

                {/* Options */}
                {item.selected_options && item.selected_options.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: '#65513F' }}>
                    {item.selected_options.map((o) => o.option_name).join(', ')}
                  </p>
                )}
                {item.selected_extras && item.selected_extras.length > 0 && (
                  <p className="text-xs" style={{ color: '#65513F' }}>
                    + {item.selected_extras.map((e) => e.extra_name).join(', ')}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center font-bold transition-colors"
                      style={{ backgroundColor: '#F3E8CC', borderColor: '#D4C4A0', color: '#3A2418' }}
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold font-mono text-sm" style={{ color: '#3A2418' }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold transition-transform active:scale-90 shadow-sm"
                      style={{ backgroundColor: '#B88727', color: '#FFF7E5' }}
                    >
                      +
                    </button>
                  </div>

                  <span
                    className="text-xl font-bold font-mono"
                    style={{ color: '#A94F2F' }}
                  >
                    {formatPrice(item.line_total)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-72 shrink-0">
          <div
            className="sticky top-24 p-5 rounded-2xl border shadow-sm"
            style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}
          >
            <h2
              className="font-bold text-lg mb-4 tracking-wide uppercase border-b pb-2"
              style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418', borderColor: '#E8D5A8' }}
            >
              RESUMEN DEL PEDIDO
            </h2>

            <div className="flex flex-col gap-2 mb-4 text-sm">
              <div className="flex justify-between" style={{ color: '#65513F' }}>
                <span>Subtotal</span>
                <span className="font-bold font-mono" style={{ color: '#3A2418' }}>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between" style={{ color: '#65513F' }}>
                <span>Envío</span>
                <span className="font-bold font-mono text-emerald-700">GRATIS</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-5" style={{ borderColor: '#E8D5A8' }}>
              <div className="flex justify-between items-center">
                <span
                  className="font-bold text-sm tracking-wide uppercase"
                  style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}
                >
                  TOTAL
                </span>
                <span
                  className="text-3xl font-bold font-mono"
                  style={{ color: '#A94F2F' }}
                >
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full py-4 rounded-xl font-bold text-center transition-transform active:scale-95 shadow-md uppercase text-sm tracking-wider"
              style={{
                backgroundColor: '#B88727',
                color: '#FFF7E5',
                fontFamily: 'Oswald, sans-serif',
              }}
            >
              CONFIRMAR PEDIDO
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
