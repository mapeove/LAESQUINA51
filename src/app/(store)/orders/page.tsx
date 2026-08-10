'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Package, Clock, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type OrderSummary = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
};

export default function OrdersSearchPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber.trim() || !phone.trim()) return;

    setLoading(true);
    setSearched(true);
    setError('');

    try {
      const cleanPhone = phone.replace(/\s+/g, '');
      const cleanOrderNum = orderNumber.trim();
      const response = await fetch(
        `/api/orders/search?orderNumber=${encodeURIComponent(cleanOrderNum)}&phone=${encodeURIComponent(cleanPhone)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al buscar el pedido');
      }

      setOrders(data.orders || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
      case 'ENTREGADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/60 text-green-300">
            <CheckCircle className="w-3 h-3" /> Entregado
          </span>
        );
      case 'PREPARING':
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/60 text-blue-300">
            <Package className="w-3 h-3" /> En proceso
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/60 text-yellow-300">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        );
    }
  };

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto animate-fade-up">
      <h1
        className="text-4xl font-bold tracking-wide mb-6 text-center"
        style={{ fontFamily: 'Bebas Neue, sans-serif', color: 'var(--brand-cream)' }}
      >
        CONSULTAR PEDIDO
      </h1>

      <div
        className="p-6 rounded-2xl border border-neutral-800 mb-8 shadow-lg"
        style={{ backgroundColor: '#111111' }}
      >
        <p className="mb-4 text-xs text-neutral-400">
          Por seguridad y privacidad de tus datos, introduce tu número de pedido y el teléfono utilizado en la compra.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Número de Pedido (ej: E51-000001) *
            </label>
            <input
              type="text"
              required
              placeholder="E51-XXXXXX"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Teléfono de contacto *
            </label>
            <input
              type="tel"
              required
              placeholder="Ej: 612345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !orderNumber.trim() || !phone.trim()}
            className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--brand-yellow)',
              color: 'var(--brand-black)',
              fontFamily: 'Oswald, sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            {loading ? (
              'VERIFICANDO...'
            ) : (
              <>
                <Search className="w-4 h-4" /> CONSULTAR PEDIDO
              </>
            )}
          </button>
        </form>

        {error && <p className="mt-4 text-red-400 text-xs font-medium">{error}</p>}
      </div>

      {searched && !loading && !error && (
        <div className="space-y-4">
          <h2
            className="font-bold text-xl mb-3"
            style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}
          >
            Resultado de la búsqueda
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/50">
              <Package className="w-10 h-10 mx-auto mb-2 text-neutral-600" />
              <p className="text-neutral-400 text-sm">
                No hemos encontrado ningún pedido que coincida exactamente con ese número y teléfono.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.order_number}`}
                  className="block p-5 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-colors"
                  style={{ backgroundColor: '#111111' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span
                        className="text-2xl font-bold font-mono"
                        style={{ color: 'var(--brand-yellow)' }}
                      >
                        {order.order_number}
                      </span>
                      <p className="text-xs text-neutral-400 mt-1">
                        {new Date(order.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-between items-center">
                    <span className="text-xs text-neutral-400 uppercase tracking-wider">Total del Pedido</span>
                    <span
                      className="text-xl font-bold"
                      style={{ fontFamily: 'Bebas Neue, sans-serif', color: 'var(--brand-yellow)' }}
                    >
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
