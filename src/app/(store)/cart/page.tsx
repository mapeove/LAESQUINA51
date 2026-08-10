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
        <svg
          className="w-20 h-20 mb-6 opacity-30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ color: 'var(--brand-yellow)' }}
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <h2
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}
        >
          Tu carrito está vacío
        </h2>
        <p className="mb-8 text-neutral-400 max-w-xs">
          ¿Aún no has decidido qué pedir? Échale un vistazo a nuestro menú.
        </p>
        <Link
          href="/menu"
          className="px-8 py-4 rounded-xl font-bold uppercase transition-transform active:scale-95"
          style={{
            backgroundColor: 'var(--brand-yellow)',
            color: 'var(--brand-black)',
            fontFamily: 'Oswald, sans-serif',
          }}
        >
          VER MENÚ
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto w-full animate-fade-up">
      <h1
        className="text-4xl font-bold tracking-wide mb-6"
        style={{ fontFamily: 'Bebas Neue, sans-serif', color: 'var(--brand-cream)' }}
      >
        TU CARRITO
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items List */}
        <div className="flex-1 flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.cart_item_id}
              className="flex gap-3 p-4 rounded-2xl border border-neutral-800"
              style={{ backgroundColor: '#111111' }}
            >
              {/* Image */}
              {item.product_image ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-neutral-800">
                  <Image
                    src={item.product_image}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-600">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  </svg>
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3
                    className="font-bold text-base leading-tight truncate"
                    style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}
                  >
                    {item.product_name}
                  </h3>
                  <button
                    onClick={() => removeItem(item.cart_item_id)}
                    className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 transition-colors flex-shrink-0"
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
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {item.selected_options.map((o) => o.option_name).join(', ')}
                  </p>
                )}
                {item.selected_extras && item.selected_extras.length > 0 && (
                  <p className="text-xs text-neutral-500">
                    + {item.selected_extras.map((e) => e.extra_name).join(', ')}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center text-white transition-colors hover:border-neutral-500"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold transition-transform active:scale-90"
                      style={{ backgroundColor: 'var(--brand-yellow)', color: 'var(--brand-black)' }}
                    >
                      +
                    </button>
                  </div>

                  <span
                    className="text-xl font-bold"
                    style={{ fontFamily: 'Bebas Neue, sans-serif', color: 'var(--brand-yellow)' }}
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
            className="sticky top-24 p-5 rounded-2xl border border-neutral-800"
            style={{ backgroundColor: '#111111' }}
          >
            <h2
              className="font-bold text-lg mb-4 tracking-wide"
              style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}
            >
              RESUMEN DEL PEDIDO
            </h2>

            <div className="flex flex-col gap-2 mb-4 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span className="text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Envío</span>
                <span className="text-green-400 font-bold">GRATIS</span>
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-4 mb-5">
              <div className="flex justify-between items-center">
                <span
                  className="font-bold text-sm tracking-wide"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  TOTAL
                </span>
                <span
                  className="text-3xl font-bold"
                  style={{ fontFamily: 'Bebas Neue, sans-serif', color: 'var(--brand-yellow)' }}
                >
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full py-4 rounded-xl font-bold text-center transition-transform active:scale-95"
              style={{
                backgroundColor: 'var(--brand-yellow)',
                color: 'var(--brand-black)',
                fontFamily: 'Oswald, sans-serif',
                letterSpacing: '0.05em',
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
